import { GraphQLClient } from "graphql-request";
import { trimAndNull, isValidMatrixRoomId } from "../lib/matrixRoomUtils.js";
import {
  ensureBotJoinedMatrixRoom,
  getMatrixInviteConfig,
  inviteUserToMatrixRoom,
  toMatrixUserId,
} from "../lib/matrixInvite.js";

/** Room for 429 retries (backoff in matrixInvite.js) when many enrollments are confirmed at once. */
const TIMEOUT_MS = 60_000;

const GET_COURSE_ROOM_AND_USER_HANDLE = `
  query GetCourseRoomAndUserHandle($courseId: Int!, $userId: uuid!) {
    Course_by_pk(id: $courseId) {
      id
      matrixRoomId
    }
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

/**
 * True when this event moves a real enrollment into CONFIRMED: a row inserted
 * as CONFIRMED, or an update whose status was something else before. Preview
 * enrollments (isTest) are an instructor looking at their own course, not a
 * participation, so they stay out of the course chat.
 */
const becameConfirmed = (event) => {
  const next = event?.data?.new;
  if (!next || next.isTest) return false;
  if (next.status !== "CONFIRMED") return false;
  if (event.op === "INSERT") return true;
  return event.op === "UPDATE" && event.data?.old?.status !== "CONFIRMED";
};

/**
 * Hasura event trigger on CourseEnrollment: invites a participant into the
 * course's Matrix room once their enrollment is confirmed.
 *
 * The "To course chat" button only deep-links into the room, and Element tends
 * to drop that link across the SSO login redirect - so without an invite a
 * first-time user signs in to an empty Element with no trace of their course.
 * An invite shows up in their room list wherever Element lands them.
 */
export default async function inviteConfirmedUserToMatrixRoom(req, logger) {
  logger.info("########## Invite Confirmed User To Matrix Room ##########");

  const event = req.body?.event;
  const courseId = Number(event?.data?.new?.courseId);
  const userId = trimAndNull(event?.data?.new?.userId);

  if (!becameConfirmed(event)) {
    return {
      success: true,
      messageKey: "MATRIX_NO_ACTION_NEEDED",
      details: "Enrollment did not just become CONFIRMED",
    };
  }

  if (!Number.isInteger(courseId) || !userId) {
    return {
      success: false,
      messageKey: "MATRIX_INVALID_EVENT_PAYLOAD",
      error: "Missing or invalid courseId/userId in event payload",
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const result = await ensureHasuraClient().request({
      document: GET_COURSE_ROOM_AND_USER_HANDLE,
      variables: { courseId, userId },
      signal: controller.signal,
    });

    const roomId = trimAndNull(result?.Course_by_pk?.matrixRoomId);
    if (!roomId) {
      return {
        success: true,
        messageKey: "MATRIX_ROOM_NOT_FOUND",
        details: "Course has no matrixRoomId. Skipping invite.",
      };
    }
    if (!isValidMatrixRoomId(roomId)) {
      return {
        success: false,
        messageKey: "MATRIX_INVALID_ROOM_ID",
        error: "matrixRoomId is not a valid Matrix room id",
      };
    }

    const matrixUserId = toMatrixUserId(result?.User_by_pk?.matrixUserHandle, matrixConfig.serverName);
    if (!matrixUserId) {
      return {
        success: true,
        messageKey: "MATRIX_USER_HANDLE_MISSING",
        details: "User has no usable matrixUserHandle. Skipping invite.",
      };
    }

    // The bot created course rooms itself, so this is normally a no-op; it
    // covers rooms an admin linked by hand.
    await ensureBotJoinedMatrixRoom({
      homeserverUrl: matrixConfig.homeserverUrl,
      token: matrixConfig.token,
      roomId,
      signal: controller.signal,
    });

    const invite = await inviteUserToMatrixRoom({
      homeserverUrl: matrixConfig.homeserverUrl,
      token: matrixConfig.token,
      roomId,
      matrixUserId,
      signal: controller.signal,
    });

    logger.info("Course participant Matrix invite processed", {
      courseId,
      userId,
      roomId,
      skipped: Boolean(invite.skipped),
    });

    return {
      success: true,
      messageKey: invite.skipped ? "MATRIX_PARTICIPANT_ALREADY_IN_ROOM" : "MATRIX_PARTICIPANT_INVITED",
      courseId,
      roomId,
    };
  } catch (error) {
    logger.error("inviteConfirmedUserToMatrixRoom failed", {
      courseId,
      userId,
      error: error.message,
      status: error.status,
      errcode: error.errcode,
    });
    return {
      success: false,
      messageKey: error.name === "AbortError" ? "MATRIX_TIMEOUT" : "MATRIX_PARTICIPANT_INVITE_FAILED",
      error: error.name === "AbortError" ? "Matrix or GraphQL request timed out" : error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}
