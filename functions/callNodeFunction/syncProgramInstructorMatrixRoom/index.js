import { GraphQLClient } from "graphql-request";
import { trimAndNull, normalizeMatrixRoomId, isValidMatrixRoomId } from "../lib/matrixRoomUtils.js";
import {
  ensureBotJoinedMatrixRoom,
  getMatrixInviteConfig,
  inviteUserToMatrixRoom,
  toMatrixUserId,
} from "../lib/matrixInvite.js";

/** Room for 429 retries (backoff in matrixInvite.js) when many instructors sync at once. */
const MATRIX_TIMEOUT_MS = 120_000;

const GET_PROGRAM_INSTRUCTOR_ROOM = `
  query GetProgramInstructorRoom($programId: Int!) {
    Program_by_pk(id: $programId) {
      id
      matrixInstructorRoomId
    }
  }
`;

const GET_PROGRAM_INSTRUCTOR_ROWS = `
  query GetProgramInstructorRows($programId: Int!) {
    CourseInstructor(where: { Course: { programId: { _eq: $programId } } }) {
      userId
    }
  }
`;

const GET_USERS_MATRIX_HANDLES = `
  query GetUsersMatrixHandles($userIds: [uuid!]!) {
    User(where: { id: { _in: $userIds } }) {
      id
      matrixUserHandle
    }
  }
`;

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

const ALLOWED_ROLES = new Set(["admin"]);

export default async function syncProgramInstructorMatrixRoom(req, logger) {
  logger.info("########## Sync Program Instructor Matrix Room ##########");

  const role = req.body?.session_variables?.["x-hasura-role"];
  if (!ALLOWED_ROLES.has(role)) {
    return {
      success: false,
      messageKey: "MATRIX_UNAUTHORIZED",
      error: "Insufficient permissions to sync program instructor room invites",
    };
  }

  const input = req.body?.input || req.body || {};
  const programId = Number(input.programId);

  if (!Number.isInteger(programId) || programId <= 0) {
    return {
      success: false,
      messageKey: "MATRIX_INVALID_INPUT",
      error: "programId must be a positive integer",
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

  let timeout;
  try {
    const hasuraClient = ensureHasuraClient();
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), MATRIX_TIMEOUT_MS);

    const programResult = await hasuraClient.request({
      document: GET_PROGRAM_INSTRUCTOR_ROOM,
      variables: { programId },
      signal: controller.signal,
    });

    if (programResult?.Program_by_pk == null) {
      return {
        success: false,
        messageKey: "PROGRAM_NOT_FOUND",
        error: "Program not found",
      };
    }

    const rawRoom = trimAndNull(programResult.Program_by_pk.matrixInstructorRoomId);
    const roomId = normalizeMatrixRoomId(rawRoom);

    if (!roomId) {
      return {
        success: true,
        messageKey: "MATRIX_PROGRAM_ROOM_NOT_SET",
        invitedCount: 0,
        skippedCount: 0,
        details: "Program has no matrixInstructorRoomId",
      };
    }

    if (!isValidMatrixRoomId(roomId)) {
      return {
        success: false,
        messageKey: "MATRIX_INVALID_ROOM_ID",
        error: "matrixInstructorRoomId is not a valid Matrix room id",
      };
    }

    try {
      await ensureBotJoinedMatrixRoom({
        homeserverUrl: matrixConfig.homeserverUrl,
        token: matrixConfig.token,
        roomId,
        signal: controller.signal,
      });
    } catch (joinErr) {
      const who = matrixConfig.botUserId || "the Matrix bot account (MATRIX_ADMIN_USER_ID)";
      logger.warn("Matrix bot could not join instructor room before sync", {
        programId,
        roomId,
        message: joinErr.message,
        errcode: joinErr.errcode,
      });
      return {
        success: false,
        messageKey: "MATRIX_BOT_NOT_IN_ROOM",
        error: `${joinErr.message} Invite ${who} to this room in Element (members list → Invite), give it permission to invite others if needed, then retry sync.`,
      };
    }

    const rows = await hasuraClient.request({
      document: GET_PROGRAM_INSTRUCTOR_ROWS,
      variables: { programId },
      signal: controller.signal,
    });

    const userIds = [
      ...new Set((rows?.CourseInstructor || []).map((r) => r?.userId).filter(Boolean)),
    ];

    const usersResult = await hasuraClient.request({
      document: GET_USERS_MATRIX_HANDLES,
      variables: { userIds },
      signal: controller.signal,
    });

    const userHandleMap = new Map();
    for (const u of usersResult?.User || []) {
      const handle = trimAndNull(u?.matrixUserHandle);
      if (handle) {
        const matrixUserId = toMatrixUserId(handle, matrixConfig.serverName);
        if (matrixUserId) userHandleMap.set(u.id, matrixUserId);
      }
    }

    let invitedCount = 0;
    let skippedCount = userIds.length - userHandleMap.size;
    let failedCount = 0;
    const failures = [];

    // Keep low: Matrix homeservers rate-limit client API (429) under parallel invites.
    const CONCURRENCY = 2;
    const entries = [...userHandleMap.entries()];

    const processInvite = async ([uid, matrixUserId]) => {
      try {
        const inv = await inviteUserToMatrixRoom({
          homeserverUrl: matrixConfig.homeserverUrl,
          token: matrixConfig.token,
          roomId,
          matrixUserId,
          signal: controller.signal,
        });
        if (inv.skipped) skippedCount += 1;
        else invitedCount += 1;
      } catch (err) {
        failedCount += 1;
        failures.push({
          userId: uid,
          message: err.message,
          errcode: err.errcode,
        });
        logger.warn("Matrix invite failed for program instructor", {
          programId,
          userId: uid,
          errcode: err.errcode,
          message: err.message,
        });
      }
    };

    for (let i = 0; i < entries.length; i += CONCURRENCY) {
      const batch = entries.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map(processInvite));
    }

    const success = failedCount === 0;

    logger.info("Program instructor Matrix sync completed", {
      programId,
      roomId,
      invitedCount,
      skippedCount,
      failedCount,
      userCount: userIds.length,
    });

    return {
      success,
      messageKey: success
        ? "MATRIX_PROGRAM_INSTRUCTOR_SYNC_DONE"
        : "MATRIX_PROGRAM_INSTRUCTOR_SYNC_INVITES_FAILED",
      invitedCount,
      skippedCount,
      failedCount,
      ...(failures.length ? { failures } : {}),
      details: success
        ? `Processed ${userIds.length} instructor(s)`
        : `${failedCount} Matrix invite(s) failed`,
    };
  } catch (error) {
    logger.error("syncProgramInstructorMatrixRoom failed", {
      programId,
      error: error.message,
      errcode: error.errcode,
    });
    return {
      success: false,
      messageKey: error.name === "AbortError" ? "MATRIX_TIMEOUT" : "MATRIX_SYNC_FAILED",
      error: error.name === "AbortError" ? "Matrix request timed out" : error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}
