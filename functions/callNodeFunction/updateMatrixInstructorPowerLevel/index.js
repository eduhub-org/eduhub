import { GraphQLClient } from "graphql-request";

const GRAPHQL_TIMEOUT_MS = 30_000;
const MATRIX_TIMEOUT_MS = 30_000;

const GET_COURSE_MATRIX_ROOM = `
  query GetCourseMatrixRoom($courseId: Int!) {
    Course_by_pk(id: $courseId) {
      id
      matrixRoomId
    }
  }
`;

const GET_USER_MATRIX_HANDLE = `
  query GetUserMatrixHandle($userId: uuid!) {
    User_by_pk(id: $userId) {
      id
      matrixUserHandle
    }
  }
`;

const trimAndNull = (value) => {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed.length === 0 ? null : trimmed;
};

const normalizeBaseUrl = (url) => url.replace(/\/+$/, "");

const deriveServerName = ({ explicitServerName, mainSpaceId, adminUserId }) => {
  if (explicitServerName) return explicitServerName;
  if (mainSpaceId && mainSpaceId.includes(":")) {
    return mainSpaceId.split(":").slice(1).join(":");
  }
  if (adminUserId && adminUserId.includes(":")) {
    return adminUserId.split(":").slice(1).join(":");
  }
  return null;
};

const toMatrixUserId = (matrixUserHandle, serverName) => {
  const trimmed = trimAndNull(matrixUserHandle);
  if (!trimmed) return null;
  const withoutSigil = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
  const localpart = withoutSigil.split(":")[0]?.trim();
  if (!localpart) return null;
  return `@${localpart}:${serverName}`;
};

const matrixHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

const parseMatrixResponse = async (response) => {
  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (response.ok) return payload;

  const error = new Error(payload?.error || `Matrix request failed with HTTP ${response.status}`);
  error.status = response.status;
  error.errcode = payload?.errcode;
  throw error;
};

const ensureHasuraClient = () => {
  if (!process.env.HASURA_ENDPOINT || !process.env.HASURA_ADMIN_SECRET) {
    throw new Error("HASURA_ENDPOINT or HASURA_ADMIN_SECRET not configured");
  }
  return new GraphQLClient(process.env.HASURA_ENDPOINT, {
    headers: {
      "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
    },
  });
};

const getMatrixConfig = () => {
  const homeserverUrl = trimAndNull(process.env.MATRIX_HOMESERVER_URL);
  const token = trimAndNull(process.env.MATRIX_ADMIN_ACCESS_TOKEN);
  const mainSpaceId = trimAndNull(process.env.MATRIX_MAIN_SPACE_ID);
  const adminUserId = trimAndNull(process.env.MATRIX_ADMIN_USER_ID);
  const explicitServerName = trimAndNull(process.env.MATRIX_SERVER_NAME);
  const serverName = deriveServerName({ explicitServerName, mainSpaceId, adminUserId });

  if (!homeserverUrl || !token || !serverName) return null;

  return {
    homeserverUrl: normalizeBaseUrl(homeserverUrl),
    token,
    serverName,
  };
};

const getCurrentPowerLevels = async ({ roomId, matrixConfig, signal }) => {
  const stateUrl = `${matrixConfig.homeserverUrl}/_matrix/client/v3/rooms/${encodeURIComponent(
    roomId
  )}/state/m.room.power_levels`;
  const response = await fetch(stateUrl, {
    method: "GET",
    headers: matrixHeaders(matrixConfig.token),
    signal,
  });
  return parseMatrixResponse(response);
};

const putPowerLevels = async ({ roomId, matrixConfig, powerLevels, signal }) => {
  const stateUrl = `${matrixConfig.homeserverUrl}/_matrix/client/v3/rooms/${encodeURIComponent(
    roomId
  )}/state/m.room.power_levels`;
  const response = await fetch(stateUrl, {
    method: "PUT",
    headers: matrixHeaders(matrixConfig.token),
    body: JSON.stringify(powerLevels),
    signal,
  });
  await parseMatrixResponse(response);
};

export default async function updateMatrixInstructorPowerLevel(req, logger) {
  const event = req.body?.event;
  const op = event?.op;
  const rowData = op === "INSERT" ? event?.data?.new : event?.data?.old;
  const courseId = Number(rowData?.courseId);
  const userId = trimAndNull(rowData?.userId);

  logger.info("########## Update Matrix Instructor Power Level ##########");
  logger.debug("Event payload (sanitized)", {
    op,
    eventId: event?.id,
    courseId,
    userId,
  });

  if (!["INSERT", "DELETE"].includes(op)) {
    return {
      success: true,
      messageKey: "MATRIX_NO_ACTION_NEEDED",
      details: `Ignoring operation ${op}`,
    };
  }

  if (!Number.isInteger(courseId) || !userId) {
    return {
      success: false,
      messageKey: "MATRIX_INVALID_EVENT_PAYLOAD",
      error: "Missing or invalid courseId/userId in event payload",
    };
  }

  const hasuraClient = ensureHasuraClient();
  const gqlController = new AbortController();
  const gqlTimeout = setTimeout(() => gqlController.abort(), GRAPHQL_TIMEOUT_MS);

  try {
    const courseResult = await hasuraClient.request({
      document: GET_COURSE_MATRIX_ROOM,
      variables: { courseId },
      signal: gqlController.signal,
    });
    const roomId = trimAndNull(courseResult?.Course_by_pk?.matrixRoomId);
    if (!roomId) {
      return {
        success: true,
        messageKey: "MATRIX_ROOM_NOT_FOUND",
        details: "Course has no matrixRoomId yet. Skipping power-level update.",
      };
    }

    const userResult = await hasuraClient.request({
      document: GET_USER_MATRIX_HANDLE,
      variables: { userId },
      signal: gqlController.signal,
    });
    const matrixUserHandle = trimAndNull(userResult?.User_by_pk?.matrixUserHandle);
    if (!matrixUserHandle) {
      return {
        success: true,
        messageKey: "MATRIX_USER_HANDLE_MISSING",
        details: "User has no matrixUserHandle. Skipping power-level update.",
      };
    }

    const matrixConfig = getMatrixConfig();
    if (!matrixConfig) {
      return {
        success: false,
        messageKey: "MATRIX_CONFIG_MISSING",
        error: "Matrix configuration is incomplete",
      };
    }

    const matrixUserId = toMatrixUserId(matrixUserHandle, matrixConfig.serverName);
    if (!matrixUserId) {
      return {
        success: true,
        messageKey: "MATRIX_USER_HANDLE_INVALID",
        details: "Could not derive a valid Matrix user ID from matrixUserHandle",
      };
    }

    const matrixController = new AbortController();
    const matrixTimeout = setTimeout(() => matrixController.abort(), MATRIX_TIMEOUT_MS);
    try {
      const currentPowerLevels = await getCurrentPowerLevels({
        roomId,
        matrixConfig,
        signal: matrixController.signal,
      });

      const nextPowerLevels = {
        ...currentPowerLevels,
        users: {
          ...(currentPowerLevels?.users || {}),
        },
      };

      if (op === "INSERT") {
        if (nextPowerLevels.users[matrixUserId] === 50) {
          return {
            success: true,
            messageKey: "MATRIX_INSTRUCTOR_POWER_LEVEL_UNCHANGED",
            details: "Instructor already has power level 50",
          };
        }
        nextPowerLevels.users[matrixUserId] = 50;
      } else if (op === "DELETE") {
        if (!(matrixUserId in nextPowerLevels.users)) {
          return {
            success: true,
            messageKey: "MATRIX_INSTRUCTOR_POWER_LEVEL_UNCHANGED",
            details: "Instructor had no explicit power level",
          };
        }
        delete nextPowerLevels.users[matrixUserId];
      }

      await putPowerLevels({
        roomId,
        matrixConfig,
        powerLevels: nextPowerLevels,
        signal: matrixController.signal,
      });

      return {
        success: true,
        messageKey: "MATRIX_INSTRUCTOR_POWER_LEVEL_UPDATED",
        roomId,
        courseId,
        op,
      };
    } finally {
      clearTimeout(matrixTimeout);
    }
  } catch (error) {
    logger.error("Failed to update Matrix instructor power level", {
      op,
      courseId,
      userId,
      error: error.message,
      status: error.status,
      errcode: error.errcode,
    });
    return {
      success: false,
      messageKey: error.name === "AbortError" ? "MATRIX_TIMEOUT" : "MATRIX_INSTRUCTOR_POWER_LEVEL_UPDATE_FAILED",
      error: error.name === "AbortError" ? "Matrix or GraphQL request timed out" : error.message,
    };
  } finally {
    clearTimeout(gqlTimeout);
  }
}
