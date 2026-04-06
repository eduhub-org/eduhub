import { GraphQLClient } from "graphql-request";
import { trimAndNull, normalizeMatrixRoomId, isValidMatrixRoomId } from "../lib/matrixRoomUtils.js";
import {
  getMatrixInviteConfig,
  inviteUserToMatrixRoom,
  toMatrixUserId,
} from "../lib/matrixInvite.js";

const MATRIX_TIMEOUT_MS = 30_000;

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

const GET_USER_MATRIX_HANDLE = `
  query GetUserMatrixHandle($userId: uuid!) {
    User_by_pk(id: $userId) {
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

  const hasuraClient = ensureHasuraClient();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MATRIX_TIMEOUT_MS);

  try {
    const programResult = await hasuraClient.request({
      document: GET_PROGRAM_INSTRUCTOR_ROOM,
      variables: { programId },
      signal: controller.signal,
    });

    const rawRoom = trimAndNull(programResult?.Program_by_pk?.matrixInstructorRoomId);
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

    const rows = await hasuraClient.request({
      document: GET_PROGRAM_INSTRUCTOR_ROWS,
      variables: { programId },
      signal: controller.signal,
    });

    const userIds = [
      ...new Set((rows?.CourseInstructor || []).map((r) => r?.userId).filter(Boolean)),
    ];

    let invitedCount = 0;
    let skippedCount = 0;

    for (const uid of userIds) {
      const userResult = await hasuraClient.request({
        document: GET_USER_MATRIX_HANDLE,
        variables: { userId: uid },
        signal: controller.signal,
      });
      const matrixUserHandle = trimAndNull(userResult?.User_by_pk?.matrixUserHandle);
      if (!matrixUserHandle) {
        skippedCount += 1;
        continue;
      }

      const matrixUserId = toMatrixUserId(matrixUserHandle, matrixConfig.serverName);
      if (!matrixUserId) {
        skippedCount += 1;
        continue;
      }

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
        logger.warn("Matrix invite failed for program instructor", {
          programId,
          userId: uid,
          errcode: err.errcode,
          message: err.message,
        });
        skippedCount += 1;
      }
    }

    logger.info("Program instructor Matrix sync completed", {
      programId,
      roomId,
      invitedCount,
      skippedCount,
      userCount: userIds.length,
    });

    return {
      success: true,
      messageKey: "MATRIX_PROGRAM_INSTRUCTOR_SYNC_DONE",
      invitedCount,
      skippedCount,
      details: `Processed ${userIds.length} instructor(s)`,
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
