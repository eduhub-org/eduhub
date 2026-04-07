import { GraphQLClient } from "graphql-request";
import { trimAndNull, normalizeMatrixRoomId, isValidMatrixRoomId } from "../lib/matrixRoomUtils.js";
import {
  ensureBotJoinedMatrixRoom,
  getMatrixInviteConfig,
  inviteUserToMatrixRoom,
  toMatrixUserId,
} from "../lib/matrixInvite.js";

const GRAPHQL_TIMEOUT_MS = 30_000;
const MATRIX_TIMEOUT_MS = 30_000;

// Per-room promise chain to serialize read-modify-write on m.room.power_levels.
const roomLocks = new Map();
const withRoomLock = (roomId, fn) => {
  const prev = roomLocks.get(roomId) || Promise.resolve();
  const next = prev.then(fn, fn);
  roomLocks.set(roomId, next);
  next.finally(() => {
    if (roomLocks.get(roomId) === next) roomLocks.delete(roomId);
  });
  return next;
};

// Tracks previous power levels we displaced so DELETE can restore them.
const prevInstructorPowerLevels = new Map();

const GET_COURSE_MATRIX_AND_PROGRAM = `
  query GetCourseMatrixAndProgram($courseId: Int!) {
    Course_by_pk(id: $courseId) {
      id
      matrixRoomId
      Program {
        id
        matrixInstructorRoomId
      }
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
      document: GET_COURSE_MATRIX_AND_PROGRAM,
      variables: { courseId },
      signal: gqlController.signal,
    });
    const course = courseResult?.Course_by_pk;
    const roomId = trimAndNull(course?.matrixRoomId);

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

    const matrixConfig = getMatrixInviteConfig();
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

    if (op === "INSERT") {
      const rawProgRoom = trimAndNull(course?.Program?.matrixInstructorRoomId);
      const programRoomId = normalizeMatrixRoomId(rawProgRoom);
      if (programRoomId && isValidMatrixRoomId(programRoomId)) {
        try {
          await ensureBotJoinedMatrixRoom({
            homeserverUrl: matrixConfig.homeserverUrl,
            token: matrixConfig.token,
            roomId: programRoomId,
            signal: gqlController.signal,
          });
          await inviteUserToMatrixRoom({
            homeserverUrl: matrixConfig.homeserverUrl,
            token: matrixConfig.token,
            roomId: programRoomId,
            matrixUserId,
            signal: gqlController.signal,
          });
        } catch (inviteErr) {
          logger.warn("Program instructor Matrix room invite failed", {
            courseId,
            userId,
            programRoomId,
            message: inviteErr.message,
            errcode: inviteErr.errcode,
          });
        }
      }
    }

    if (!roomId) {
      return {
        success: true,
        messageKey: "MATRIX_ROOM_NOT_FOUND",
        details: "Course has no matrixRoomId yet. Skipping power-level update.",
      };
    }

    const result = await withRoomLock(roomId, async () => {
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

        const existingLevel = nextPowerLevels.users[matrixUserId];

        if (op === "INSERT") {
          if (existingLevel != null && existingLevel >= 50) {
            return {
              success: true,
              messageKey: "MATRIX_INSTRUCTOR_POWER_LEVEL_UNCHANGED",
              details: `Instructor already has power level ${existingLevel}`,
            };
          }
          if (existingLevel != null) {
            prevInstructorPowerLevels.set(`${roomId}:${matrixUserId}`, existingLevel);
          }
          nextPowerLevels.users[matrixUserId] = 50;
        } else if (op === "DELETE") {
          if (existingLevel == null) {
            return {
              success: true,
              messageKey: "MATRIX_INSTRUCTOR_POWER_LEVEL_UNCHANGED",
              details: "Instructor had no explicit power level",
            };
          }
          if (existingLevel > 50) {
            return {
              success: true,
              messageKey: "MATRIX_INSTRUCTOR_POWER_LEVEL_UNCHANGED",
              details: `Instructor has elevated power level ${existingLevel}; leaving untouched`,
            };
          }
          const prevKey = `${roomId}:${matrixUserId}`;
          const prevLevel = prevInstructorPowerLevels.get(prevKey);
          if (prevLevel != null) {
            nextPowerLevels.users[matrixUserId] = prevLevel;
            prevInstructorPowerLevels.delete(prevKey);
          } else {
            delete nextPowerLevels.users[matrixUserId];
          }
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
    });
    return result;
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
