import { GraphQLClient } from 'graphql-request';
import { sendSessionRescheduledEmails } from '../lib/sessionRescheduledEmail.js';
import { ORG_ADMIN_ROLES, isOrgAdminOfCourse } from '../lib/orgAdminScope.js';

// Request roles from session_variables, not the inherited-role names used in
// actions.yaml: a request carries `instructor`/`admin`, Hasura maps it to
// `instructor_access` internally.
const ALLOWED_ROLES = new Set(['admin', 'instructor_access', 'instructor', ...ORG_ADMIN_ROLES]);
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
      PublicEvent {
        id
        Sessions(order_by: { startDateTime: asc }, limit: 1) {
          id
          title
          courseId
          startDateTime
          endDateTime
        }
      }
    }
  }
`;

const SKIPPED = { success: true, messageKey: 'NO_RECIPIENTS', queued: 0, total: 0 };

/**
 * One result for the editor out of the course's and the public event's
 * mailing: it only counts as sent when both went out. `courseSent` tells the
 * caller whether the course mailing is done, so a retry after a failed event
 * mailing can skip it instead of mailing the course participants twice.
 */
const combineResults = (courseResult, eventResult) => {
  if (!courseResult?.success) return { ...courseResult, courseSent: false };
  if (!eventResult?.success) return { ...eventResult, courseSent: true };
  const queued = (courseResult.queued ?? 0) + (eventResult.queued ?? 0);
  const total = (courseResult.total ?? 0) + (eventResult.total ?? 0);
  return {
    success: true,
    messageKey: total === 0 ? 'NO_RECIPIENTS' : 'SESSION_RESCHEDULED_QUEUED',
    queued,
    total,
    courseSent: true,
  };
};

/**
 * Mails the active (CONFIRMED/REGISTERED) participants of a session's course
 * that the session was rescheduled. When the session was opened to the public
 * as an event, the event's registrants are mailed too: the event's session
 * already carries the new time (a database trigger mirrors it), and their mail
 * links to the event page. A retry passes `skipCourse` when the course mailing
 * already went out, so only the event's registrants are mailed again.
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
    // An org admin manages the course without instructing it (course management page).
    const mayManage =
      ADMIN_ROLES.has(role) ||
      isInstructorOfCourse ||
      (ORG_ADMIN_ROLES.has(role) && (await isOrgAdminOfCourse(client, userId, session.courseId)));
    if (!mayManage) {
      logger.warn(`User ${userId} is not an instructor of course ${session.courseId}`);
      return {
        success: false,
        messageKey: 'NOTIFY_SESSION_UNAUTHORIZED',
        error: 'Not an instructor of this course',
      };
    }

    const skipCourse = req.body?.input?.skipCourse === true;
    const courseResult = skipCourse ? SKIPPED : await sendSessionRescheduledEmails({ session, client, logger });
    const eventSession = session.PublicEvent?.Sessions?.[0];
    const eventResult = eventSession
      ? await sendSessionRescheduledEmails({ session: eventSession, client, logger })
      : SKIPPED;
    return combineResults(courseResult, eventResult);
  } catch (error) {
    logger.error(`Error notifying session participants: ${error.message}`, { error });
    return { success: false, error: error.message, messageKey: 'NOTIFY_SESSION_FAILED' };
  }
}
