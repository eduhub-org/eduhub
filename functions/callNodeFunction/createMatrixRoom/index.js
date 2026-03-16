import { GraphQLClient } from "graphql-request";

const GET_COURSE_CONTEXT = `
  query GetCourseContext($courseId: Int!) {
    Course_by_pk(id: $courseId) {
      id
      title
      matrixRoomId
      Program {
        id
        shortTitle
        matrixSpaceId
      }
    }
  }
`;

const GET_PROGRAM_SPACE = `
  query GetProgramSpace($programId: Int!) {
    Program_by_pk(id: $programId) {
      id
      matrixSpaceId
    }
  }
`;

const GET_COURSE_ROOM = `
  query GetCourseRoom($courseId: Int!) {
    Course_by_pk(id: $courseId) {
      id
      matrixRoomId
    }
  }
`;

const GET_COURSE_INSTRUCTORS = `
  query GetCourseInstructors($courseId: Int!) {
    CourseInstructor(where: { courseId: { _eq: $courseId } }) {
      User {
        matrixUserHandle
      }
    }
  }
`;

const SET_PROGRAM_SPACE_IF_EMPTY = `
  mutation SetProgramSpaceIfEmpty($programId: Int!, $spaceId: String!) {
    update_Program(
      where: { id: { _eq: $programId }, matrixSpaceId: { _is_null: true } }
      _set: { matrixSpaceId: $spaceId }
    ) {
      affected_rows
      returning {
        id
        matrixSpaceId
      }
    }
  }
`;

const SET_COURSE_ROOM_IF_EMPTY = `
  mutation SetCourseRoomIfEmpty($courseId: Int!, $roomId: String!) {
    update_Course(
      where: { id: { _eq: $courseId }, matrixRoomId: { _is_null: true } }
      _set: { matrixRoomId: $roomId }
    ) {
      affected_rows
      returning {
        id
        matrixRoomId
      }
    }
  }
`;

const ALLOWED_ROLES = new Set(["admin", "admin-ras", "instructor_access", "instructor"]);

const trimAndNull = (value) => {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed.length === 0 ? null : trimmed;
};

const validateLength = (value, maxLength) => value == null || value.length <= maxLength;

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

const buildChatLink = (elementClientUrl, roomId) =>
  `${normalizeBaseUrl(elementClientUrl)}/#/room/${roomId}`;

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

  if (response.ok) {
    return payload;
  }

  const error = new Error(payload?.error || `Matrix request failed with HTTP ${response.status}`);
  error.status = response.status;
  error.errcode = payload?.errcode;
  error.payload = payload;
  throw error;
};

const createRoomWithAlias = async ({
  homeserverUrl,
  token,
  aliasLocalPart,
  serverName,
  payload,
  signal,
}) => {
  const createPayload = { ...payload, room_alias_name: aliasLocalPart };
  const response = await fetch(`${homeserverUrl}/_matrix/client/v3/createRoom`, {
    method: "POST",
    headers: matrixHeaders(token),
    body: JSON.stringify(createPayload),
    signal,
  });

  try {
    const result = await parseMatrixResponse(response);
    return result.room_id;
  } catch (error) {
    if (error.errcode !== "M_ROOM_IN_USE") throw error;

    const alias = `#${aliasLocalPart}:${serverName}`;
    const aliasResponse = await fetch(
      `${homeserverUrl}/_matrix/client/v3/directory/room/${encodeURIComponent(alias)}`,
      {
        method: "GET",
        headers: matrixHeaders(token),
        signal,
      }
    );
    const aliasResult = await parseMatrixResponse(aliasResponse);
    return aliasResult.room_id;
  }
};

const putStateEvent = async ({
  homeserverUrl,
  token,
  roomId,
  eventType,
  stateKey,
  content,
  signal,
}) => {
  const response = await fetch(
    `${homeserverUrl}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/state/${eventType}/${encodeURIComponent(
      stateKey
    )}`,
    {
      method: "PUT",
      headers: matrixHeaders(token),
      body: JSON.stringify(content),
      signal,
    }
  );
  await parseMatrixResponse(response);
};

const linkParentAndChild = async ({
  homeserverUrl,
  token,
  serverName,
  parentSpaceId,
  childRoomId,
  canonical = true,
  signal,
}) => {
  const via = [serverName];
  await putStateEvent({
    homeserverUrl,
    token,
    roomId: parentSpaceId,
    eventType: "m.space.child",
    stateKey: childRoomId,
    content: { via },
    signal,
  });

  await putStateEvent({
    homeserverUrl,
    token,
    roomId: childRoomId,
    eventType: "m.space.parent",
    stateKey: parentSpaceId,
    content: { via, canonical },
    signal,
  });
};

const sanitizeAliasLocalPart = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9._=\-\/]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

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
  const elementClientUrl = trimAndNull(process.env.MATRIX_ELEMENT_CLIENT_URL);
  const mainSpaceId = trimAndNull(process.env.MATRIX_MAIN_SPACE_ID);
  const adminUserId = trimAndNull(process.env.MATRIX_ADMIN_USER_ID);
  const explicitServerName = trimAndNull(process.env.MATRIX_SERVER_NAME);
  const serverName = deriveServerName({ explicitServerName, mainSpaceId, adminUserId });

  if (!homeserverUrl || !token || !elementClientUrl || !mainSpaceId || !serverName) {
    return null;
  }

  return {
    homeserverUrl: normalizeBaseUrl(homeserverUrl),
    token,
    elementClientUrl: normalizeBaseUrl(elementClientUrl),
    mainSpaceId,
    serverName,
  };
};

const toMatrixUserId = (matrixUserHandle, serverName) => {
  const trimmed = trimAndNull(matrixUserHandle);
  if (!trimmed) return null;
  const withoutSigil = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
  const localpart = withoutSigil.split(":")[0]?.trim();
  if (!localpart) return null;
  return `@${localpart}:${serverName}`;
};

const buildInstructorUsersMap = async ({ hasuraClient, courseId, serverName, logger, signal }) => {
  try {
    const instructorResult = await hasuraClient.request({
      document: GET_COURSE_INSTRUCTORS,
      variables: { courseId },
      signal,
    });
    const users = {};
    for (const courseInstructor of instructorResult?.CourseInstructor || []) {
      const matrixUserId = toMatrixUserId(courseInstructor?.User?.matrixUserHandle, serverName);
      if (matrixUserId) {
        users[matrixUserId] = 50;
      }
    }
    return users;
  } catch (error) {
    // Instructor power levels are best-effort and must not block room creation.
    logger.warn("Unable to resolve instructor matrix handles during room creation", {
      courseId,
      error: error.message,
    });
    return {};
  }
};

const MATRIX_FETCH_TIMEOUT_MS = 30_000;

const ADMIN_ROLES = new Set(["admin", "admin-ras"]);

const CHECK_INSTRUCTOR_ASSIGNMENT = `
  query CheckInstructorAssignment($courseId: Int!, $userId: uuid!) {
    CourseInstructor(where: { courseId: { _eq: $courseId }, userId: { _eq: $userId } }) {
      courseId
    }
  }
`;

export default async function createMatrixRoom(req, logger) {
  logger.info("########## Create Matrix Room ##########");

  const role = req.body?.session_variables?.["x-hasura-role"];
  if (!ALLOWED_ROLES.has(role)) {
    return {
      success: false,
      messageKey: "MATRIX_UNAUTHORIZED",
      error: "Insufficient permissions for Matrix room creation",
    };
  }

  const input = req.body?.input || req.body || {};
  const courseId = Number(input.courseId);
  const roomName = trimAndNull(input.roomName);
  const topic = trimAndNull(input.topic);
  const spaceName = trimAndNull(input.spaceName);

  if (!Number.isInteger(courseId) || courseId <= 0) {
    return {
      success: false,
      messageKey: "MATRIX_INVALID_INPUT",
      error: "courseId must be a positive integer",
    };
  }
  if (!roomName || !validateLength(roomName, 120)) {
    return {
      success: false,
      messageKey: "MATRIX_INVALID_INPUT",
      error: "roomName is required and must be <= 120 characters",
    };
  }
  if (!validateLength(topic, 500)) {
    return {
      success: false,
      messageKey: "MATRIX_INVALID_INPUT",
      error: "topic must be <= 500 characters",
    };
  }
  if (!validateLength(spaceName, 120)) {
    return {
      success: false,
      messageKey: "MATRIX_INVALID_INPUT",
      error: "spaceName must be <= 120 characters",
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MATRIX_FETCH_TIMEOUT_MS);

  try {
    const hasuraClient = ensureHasuraClient();

    if (!ADMIN_ROLES.has(role)) {
      const userId = req.body?.session_variables?.["x-hasura-user-id"];
      if (!userId) {
        return {
          success: false,
          messageKey: "MATRIX_UNAUTHORIZED",
          error: "User ID missing from session",
        };
      }
      const assignment = await hasuraClient.request({
        document: CHECK_INSTRUCTOR_ASSIGNMENT,
        variables: { courseId, userId },
        signal: controller.signal,
      });
      if (!assignment?.CourseInstructor?.length) {
        return {
          success: false,
          messageKey: "MATRIX_UNAUTHORIZED",
          error: "You are not an instructor for this course",
        };
      }
    }

    const context = await hasuraClient.request({
      document: GET_COURSE_CONTEXT,
      variables: { courseId },
      signal: controller.signal,
    });
    const course = context?.Course_by_pk;
    const program = course?.Program;

    if (!course || !program) {
      return {
        success: false,
        messageKey: "MATRIX_COURSE_NOT_FOUND",
        error: "Course or related program not found",
      };
    }

    if (course.matrixRoomId) {
      return {
        success: true,
        messageKey: "MATRIX_ROOM_ALREADY_EXISTS",
        roomId: course.matrixRoomId,
        spaceId: program.matrixSpaceId,
        chatLink: buildChatLink(matrixConfig.elementClientUrl, course.matrixRoomId),
        alreadyExists: true,
      };
    }

    let spaceId = program.matrixSpaceId;
    const spaceLabel = spaceName || program.shortTitle || `Program ${program.id}`;

    if (!spaceId) {
      const spaceAliasLocalPart = sanitizeAliasLocalPart(`edu-program-${program.id}`);
      const createdSpaceId = await createRoomWithAlias({
        homeserverUrl: matrixConfig.homeserverUrl,
        token: matrixConfig.token,
        aliasLocalPart: spaceAliasLocalPart,
        serverName: matrixConfig.serverName,
        signal: controller.signal,
        payload: {
          name: spaceLabel,
          visibility: "private",
          preset: "private_chat",
          creation_content: { type: "m.space" },
          initial_state: [
            { type: "m.room.join_rules", content: { join_rule: "public" } },
            { type: "m.room.guest_access", content: { guest_access: "forbidden" } },
            { type: "m.room.history_visibility", content: { history_visibility: "shared" } },
          ],
        },
      });

      await linkParentAndChild({
        homeserverUrl: matrixConfig.homeserverUrl,
        token: matrixConfig.token,
        serverName: matrixConfig.serverName,
        parentSpaceId: matrixConfig.mainSpaceId,
        childRoomId: createdSpaceId,
        canonical: true,
        signal: controller.signal,
      });

      const setSpaceResult = await hasuraClient.request({
        document: SET_PROGRAM_SPACE_IF_EMPTY,
        variables: {
          programId: program.id,
          spaceId: createdSpaceId,
        },
        signal: controller.signal,
      });

      if (setSpaceResult.update_Program.affected_rows > 0) {
        spaceId = createdSpaceId;
      } else {
        const latestProgram = await hasuraClient.request({
          document: GET_PROGRAM_SPACE,
          variables: { programId: program.id },
          signal: controller.signal,
        });
        spaceId = latestProgram?.Program_by_pk?.matrixSpaceId || createdSpaceId;
      }
    }

    if (!spaceId) {
      return {
        success: false,
        messageKey: "MATRIX_SPACE_RESOLUTION_FAILED",
        error: "Unable to resolve program space id",
      };
    }

    const roomAliasLocalPart = sanitizeAliasLocalPart(`edu-course-${course.id}`);
    const instructorUsers = await buildInstructorUsersMap({
      hasuraClient,
      courseId: course.id,
      serverName: matrixConfig.serverName,
      logger,
      signal: controller.signal,
    });
    const roomId = await createRoomWithAlias({
      homeserverUrl: matrixConfig.homeserverUrl,
      token: matrixConfig.token,
      aliasLocalPart: roomAliasLocalPart,
      serverName: matrixConfig.serverName,
      signal: controller.signal,
      payload: {
        name: roomName,
        topic: topic || "",
        visibility: "private",
        preset: "private_chat",
        initial_state: [
          { type: "m.room.join_rules", content: { join_rule: "public" } },
          { type: "m.room.guest_access", content: { guest_access: "forbidden" } },
          { type: "m.room.history_visibility", content: { history_visibility: "joined" } },
          {
            type: "m.room.power_levels",
            content: {
              users: instructorUsers,
              users_default: 0,
              events_default: 0,
              state_default: 50,
              redact: 50,
              ban: 50,
              kick: 50,
              invite: 0,
            },
          },
        ],
      },
    });

    await linkParentAndChild({
      homeserverUrl: matrixConfig.homeserverUrl,
      token: matrixConfig.token,
      serverName: matrixConfig.serverName,
      parentSpaceId: spaceId,
      childRoomId: roomId,
      canonical: true,
      signal: controller.signal,
    });

    const setRoomResult = await hasuraClient.request({
      document: SET_COURSE_ROOM_IF_EMPTY,
      variables: {
        courseId: course.id,
        roomId,
      },
      signal: controller.signal,
    });

    let persistedRoomId = roomId;
    if (setRoomResult.update_Course.affected_rows === 0) {
      const latestCourse = await hasuraClient.request({
        document: GET_COURSE_ROOM,
        variables: { courseId: course.id },
        signal: controller.signal,
      });
      persistedRoomId = latestCourse?.Course_by_pk?.matrixRoomId || roomId;
    }

    logger.info("Matrix room create flow completed", {
      courseId: course.id,
      programId: program.id,
      spaceId,
      roomId: persistedRoomId,
    });

    return {
      success: true,
      messageKey: "MATRIX_ROOM_CREATED",
      spaceId,
      roomId: persistedRoomId,
      chatLink: buildChatLink(matrixConfig.elementClientUrl, persistedRoomId),
      alreadyExists: persistedRoomId !== roomId,
    };
  } catch (error) {
    logger.error("Failed to create matrix room", {
      courseId,
      role,
      error: error.message,
      errcode: error.errcode,
      status: error.status,
    });
    return {
      success: false,
      messageKey: error.name === "AbortError" ? "MATRIX_TIMEOUT" : "MATRIX_CREATION_FAILED",
      error: error.name === "AbortError"
        ? "Matrix request timed out"
        : (error.message || "Failed to create Matrix room"),
    };
  } finally {
    clearTimeout(timeout);
  }
}
