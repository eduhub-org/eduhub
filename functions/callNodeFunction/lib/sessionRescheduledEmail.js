import { gql } from 'graphql-request';
import { queueEmail } from './queueEmail.js';
import { withRetry } from './withRetry.js';
import { createVariableReplacer } from '../emailTemplateVariables.js';

const GET_ENROLLEES = gql`
  query GetActiveEnrollees($courseId: Int!) {
    Course_by_pk(id: $courseId) {
      id
      title
      CourseEnrollments(where: { isTest: { _eq: false }, status: { _in: [CONFIRMED, REGISTERED] } }) {
        User { id email firstName lastName status }
      }
    }
  }
`;

const formatDate = (dateString) =>
  dateString ? new Date(dateString).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
const formatDateTime = (dateString) =>
  dateString ? new Date(dateString).toLocaleString('de-DE', { dateStyle: 'long', timeStyle: 'short' }) : '';
const formatTime = (dateString) =>
  dateString ? new Date(dateString).toLocaleTimeString('de-DE', { timeStyle: 'short' }) : '';

/**
 * Queues the SESSION_RESCHEDULED mail for every active participant of the
 * session's course.
 *
 * The caller decides *whether* to notify — the automatic event trigger this
 * logic used to live behind is gone, so the Sessions tab asks the editor first
 * and then calls the notifySessionParticipants action.
 *
 * @param {Object} params
 * @param {Object} params.session - { id, title, courseId, startDateTime, endDateTime }
 * @param {import('graphql-request').GraphQLClient} params.client
 * @param {Object} params.logger - Winston logger instance
 * @returns {Promise<Object>} { success, messageKey, queued, total } or an error result
 */
export async function sendSessionRescheduledEmails({ session, client, logger }) {
  const courseId = session.courseId;

  const courseData = await withRetry(() => client.request(GET_ENROLLEES, { courseId }), {
    logger,
    description: `enrollee lookup for course ${courseId}`,
  });
  const course = courseData?.Course_by_pk;
  if (!course) {
    return { success: false, error: 'Course not found', messageKey: 'COURSE_NOT_FOUND' };
  }

  // Anonymized records keep their past enrollments (the retention cron leaves
  // them in place), but their address is a placeholder that goes nowhere.
  const recipients = (course.CourseEnrollments || [])
    .map((e) => e.User)
    .filter((u) => u?.email && u.status !== 'DELETED');
  const seen = new Set();
  const uniqueRecipients = recipients.filter((u) => (seen.has(u.email) ? false : (seen.add(u.email), true)));

  if (uniqueRecipients.length === 0) {
    return { success: true, messageKey: 'NO_RECIPIENTS', message: 'No active enrollees to notify', queued: 0, total: 0 };
  }

  const formattedStart = formatDateTime(session.startDateTime);
  // An end-time-only change is notifiable too, so the mail has to show the end
  // time. Same-day sessions only need the clock time for it.
  const endsOnStartDay =
    session.startDateTime &&
    session.endDateTime &&
    new Date(session.startDateTime).toDateString() === new Date(session.endDateTime).toDateString();
  const formattedEnd = endsOnStartDay ? formatTime(session.endDateTime) : formatDateTime(session.endDateTime);

  let queued = 0;
  for (const user of uniqueRecipients) {
    const replacer = createVariableReplacer(
      {
        user,
        course: { id: course.id, title: course.title },
        session: { title: session.title, startDateTime: formattedStart, endDateTime: formattedEnd },
        courseLink: `${process.env.FRONTEND_URL || 'https://edu.opencampus.sh'}/course/${course.id}`,
      },
      formatDate
    );
    const result = await queueEmail({
      templateType: 'SESSION_RESCHEDULED',
      variableReplacer: replacer,
      recipientEmail: user.email,
      courseId: course.id,
      // A guest has no account page to check the new date on, so this mail
      // has to carry their manage link like every other one.
      recipientUser: user,
      client,
      logger,
    });
    if (result?.success) queued += 1;
  }

  logger.info(`SESSION_RESCHEDULED for course ${course.id}: queued ${queued}/${uniqueRecipients.length}`);
  // queueEmail fails per recipient (bad address, missing template, insert
  // error) without stopping the loop. A partial batch is not a success: the
  // caller shows the editor "participants informed", so it has to hear that
  // some of them were not.
  if (queued < uniqueRecipients.length) {
    return {
      success: false,
      messageKey: 'SESSION_RESCHEDULED_QUEUE_FAILED',
      error: `Only ${queued} of ${uniqueRecipients.length} notifications were queued`,
      queued,
      total: uniqueRecipients.length,
    };
  }
  return { success: true, messageKey: 'SESSION_RESCHEDULED_QUEUED', queued, total: uniqueRecipients.length };
}
