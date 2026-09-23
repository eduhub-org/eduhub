import { GraphQLClient } from 'graphql-request';
import { sendSessionRescheduledEmails } from '../lib/sessionRescheduledEmail.js';

// Request roles from session_variables, not the inherited-role names used in
// actions.yaml: a request carries `instructor`/`admin`, Hasura maps it to
// `instructor_access` internally.
const ALLOWED_ROLES = new Set(['admin', 'instructor_access', 'instructor']);
const ADMIN_ROLES = new Set(['admin']);

const GET_SESSION_FOR_NOTIFICATION = `
  query GetSessionForNotification($sessionId: Int!, $userId: uuid!) {
    Session_by_pk(id: $sessionId) {
      id
      title
      courseId
      startDateTime
      endDateTime
      Course {
        id
        CourseInstructors(where: { userId: { _eq: $userId } }) {
          courseId
        }
      }
    }
  }
`;

/**
 * Mails the active (CONFIRMED/REGISTERED) participants of a session's course
 * that the session was rescheduled.
 *
 * This replaces the former `send_session_rescheduled_email` event trigger: the
 * Sessions tab now asks the editor whether participants should be informed and
 * calls this action only on confirmation.
 *
 * Authorization lives here rather than in Hasura's row permissions, because the
 * action queries with the admin secret — the `instructor_access` filter on
 * Session does not apply to it.
 *
 * @param {Object} req - Request object from the Hasura action
 * @param {Object} logger - Winston logger instance
 * @returns {Promise<Object>} Response object
 */
export default async function notifySessionParticipants(req, logger) {
  logger.info('########## Notify Session Participants ##########');

  const role = req.body?.session_variables?.['x-hasura-role'];
  if (!ALLOWED_ROLES.has(role)) {
    return {
      success: false,
      messageKey: 'NOTIFY_SESSION_UNAUTHORIZED',
      error: 'Insufficient permissions to notify session participants',
    };
  }

  const userId = req.body?.session_variables?.['x-hasura-user-id'];
  if (!userId) {
    return {
      success: false,
      messageKey: 'NOTIFY_SESSION_UNAUTHORIZED',
      error: 'User ID missing from session',
    };
  }

  const sessionId = Number(req.body?.input?.sessionId);
  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    return {
      success: false,
      messageKey: 'NOTIFY_SESSION_INVALID_INPUT',
      error: 'sessionId must be a positive integer',
    };
  }

  try {
    if (!process.env.HASURA_ENDPOINT || !process.env.HASURA_ADMIN_SECRET) {
      throw new Error('HASURA_ENDPOINT or HASURA_ADMIN_SECRET not configured');
    }
    const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
      headers: { 'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET },
    });

    const result = await client.request(GET_SESSION_FOR_NOTIFICATION, { sessionId, userId });
    const session = result?.Session_by_pk;
    if (!session) {
      return { success: false, messageKey: 'SESSION_NOT_FOUND', error: `Session ${sessionId} not found` };
    }

    const isInstructorOfCourse = (session.Course?.CourseInstructors || []).length > 0;
    if (!ADMIN_ROLES.has(role) && !isInstructorOfCourse) {
      logger.warn(`User ${userId} is not an instructor of course ${session.courseId}`);
      return {
        success: false,
        messageKey: 'NOTIFY_SESSION_UNAUTHORIZED',
        error: 'Not an instructor of this course',
      };
    }

    return await sendSessionRescheduledEmails({ session, client, logger });
  } catch (error) {
    logger.error(`Error notifying session participants: ${error.message}`, { error });
    return { success: false, error: error.message, messageKey: 'NOTIFY_SESSION_FAILED' };
  }
}
