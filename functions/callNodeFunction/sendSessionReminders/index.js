import { gql, GraphQLClient } from 'graphql-request';
import { createVariableReplacer } from '../emailTemplateVariables.js';
import { queueEmail } from '../lib/queueEmail.js';

const HOUR_MS = 60 * 60 * 1000;
const TIME_ZONE = 'Europe/Berlin';

// The longest lead time a course can choose (1 week). Only courses whose first
// session starts within this horizon can be due, which keeps the query small.
export const MAX_LEAD_HOURS = 168;

// Placeholder the migration gave LocationAddress rows it could not match; not
// worth showing to a participant (same rule as the frontend's meaningfulLabel).
const PLACEHOLDER_LABEL = 'generic address';

/**
 * Whether a course's reminder is due: its first session has not started yet
 * and we are inside its lead time. There is no lower bound on purpose, so a
 * participant who enrolls late, or a cron run that was missed, still gets it.
 */
export function isReminderDue(firstSessionStart, leadHours, now) {
  if (!firstSessionStart || leadHours == null) return false;
  const start = new Date(firstSessionStart).getTime();
  return start > now.getTime() && start - leadHours * HOUR_MS <= now.getTime();
}

const dateFormat = new Intl.DateTimeFormat('de-DE', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const timeFormat = new Intl.DateTimeFormat('de-DE', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/**
 * "27.10.2026, 17:00" in Berlin time. Numeric and 24h because the template
 * carries German and English in one body, and this reads right in both.
 */
export function formatReminderDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  return `${dateFormat.format(date)}, ${timeFormat.format(date)}`;
}

/**
 * "27.10.2026, 17:00–19:00", or both full timestamps when the session ends on
 * another day.
 */
export function formatReminderDateTimeRange(start, end) {
  if (!start) return '';
  if (!end) return formatReminderDateTime(start);
  const sameDay = dateFormat.format(new Date(start)) === dateFormat.format(new Date(end));
  return sameDay
    ? `${formatReminderDateTime(start)}–${timeFormat.format(new Date(end))}`
    : `${formatReminderDateTime(start)} – ${formatReminderDateTime(end)}`;
}

// Still filled for customized templates that use [Session:Duration].
function formatDuration(start, end) {
  if (!start || !end) return '';
  const minutes = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

/**
 * Where the session takes place, as display strings: a linked venue as
 * "Label (Address)", else the free-text address, which for online sessions is
 * the meeting link. Online without a link yet just says "Online".
 */
export function resolveSessionLocations(sessionAddresses = []) {
  const locations = sessionAddresses.map((sa) => {
    const venue = sa.LocationAddress;
    const label = venue?.shortLabel?.trim();
    const venueAddress = venue?.address?.trim();
    if (venueAddress) {
      return label && label.toLowerCase() !== PLACEHOLDER_LABEL && label !== venueAddress
        ? `${label} (${venueAddress})`
        : venueAddress;
    }
    const address = sa.address?.trim();
    if (address) return address;
    return sa.CourseLocation?.locationOption === 'ONLINE' ? 'Online' : '';
  });
  return [...new Set(locations.filter(Boolean))];
}

const GET_REMINDER_CANDIDATES = gql`
  query GetSessionReminderCandidates($now: timestamptz!, $horizon: timestamptz!) {
    Course(
      where: {
        sessionReminderLeadHours: { _is_null: false }
        Sessions: { startDateTime: { _gt: $now, _lte: $horizon } }
        # REGISTERED sits alongside CONFIRMED: it is what the direct
        # registration flows write when there is no approval step, guest
        # signup included. Those people are attending, so they get the reminder.
        CourseEnrollments: { isTest: { _eq: false }, status: { _in: [CONFIRMED, REGISTERED] } }
      }
    ) {
      id
      title
      sessionReminderLeadHours
      # The course's first session overall; if it already started, the course
      # is under way and no reminder is due.
      Sessions(order_by: { startDateTime: asc }, limit: 1) {
        id
        title
        startDateTime
        endDateTime
        SessionAddresses(order_by: { id: asc }) {
          address
          CourseLocation {
            locationOption
          }
          LocationAddress {
            shortLabel
            address
          }
        }
      }
      CourseEnrollments(where: { isTest: { _eq: false }, status: { _in: [CONFIRMED, REGISTERED] } }) {
        id
        User {
          id
          firstName
          lastName
          email
          status
        }
      }
    }
  }
`;

// Every reminder ever queued for the course, whatever became of it: a reminder
// goes out at most once, so a bounced or failed one is not retried.
const GET_SENT_REMINDERS = gql`
  query GetSentSessionReminders($metadata: jsonb!) {
    MailLog(where: { metadata: { _contains: $metadata } }) {
      metadata
    }
  }
`;

/**
 * Queues the one session reminder each participant gets per course, a
 * course-chosen number of hours before the course's first session. Runs from a
 * cron trigger every 15 minutes; MailLog metadata records who already has it.
 *
 * @param {Object} req - Request object (from the cron trigger)
 * @param {Object} logger - Winston logger instance
 * @returns {Object} Response object
 */
export default async function sendSessionReminders(req, logger) {
  logger.info('########## Send Session Reminders ##########');

  try {
    const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
      headers: {
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET,
      },
    });

    const now = new Date();
    const horizon = new Date(now.getTime() + MAX_LEAD_HOURS * HOUR_MS);
    const data = await client.request(GET_REMINDER_CANDIDATES, {
      now: now.toISOString(),
      horizon: horizon.toISOString(),
    });

    const dueCourses = (data?.Course ?? []).filter((course) =>
      isReminderDue(course.Sessions[0]?.startDateTime, course.sessionReminderLeadHours, now)
    );

    let totalEmailsSent = 0;
    let totalEmailsFailed = 0;
    const processedSessions = [];

    for (const course of dueCourses) {
      const session = course.Sessions[0];
      const sentData = await client.request(GET_SENT_REMINDERS, {
        metadata: { type: 'SESSION_REMINDER', courseId: course.id },
      });
      const alreadyReminded = new Set(
        (sentData?.MailLog ?? []).map((mail) => mail.metadata?.userId).filter(Boolean)
      );

      const location = resolveSessionLocations(session.SessionAddresses);
      let sessionEmailsSent = 0;

      for (const enrollment of course.CourseEnrollments) {
        const user = enrollment.User;
        // Anonymized records keep past enrollments but their address is a
        // placeholder that goes nowhere.
        if (!user?.email || user.status === 'DELETED') continue;
        if (alreadyReminded.has(user.id)) continue;

        const replaceVariables = createVariableReplacer({
          user,
          course: { id: course.id, title: course.title },
          session: {
            title: session.title,
            startDateTime: formatReminderDateTime(session.startDateTime),
            endDateTime: formatReminderDateTime(session.endDateTime),
            dateTimeRange: formatReminderDateTimeRange(session.startDateTime, session.endDateTime),
            duration: formatDuration(session.startDateTime, session.endDateTime),
            location,
          },
          courseLink: `${process.env.FRONTEND_URL || 'https://edu.opencampus.sh'}/course/${course.id}`,
        });

        const result = await queueEmail({
          templateType: 'SESSION_REMINDER',
          variableReplacer: replaceVariables,
          recipientEmail: user.email,
          courseId: course.id,
          // A guest has no account page to check the session details on, so
          // queueEmail appends their manage link like on every other mail.
          recipientUser: user,
          // This *is* the sent-reminder record GET_SENT_REMINDERS reads back.
          metadata: {
            type: 'SESSION_REMINDER',
            courseId: course.id,
            sessionId: session.id,
            userId: user.id,
          },
          client,
          logger,
        });

        if (result?.success) {
          totalEmailsSent++;
          sessionEmailsSent++;
          alreadyReminded.add(user.id);
        } else {
          // Nothing was logged for this participant, so the next run tries again.
          totalEmailsFailed++;
          logger.error(
            `Session reminder for course ${course.id} not queued for user ${user.id}: ${result?.messageKey ?? 'unknown error'}`
          );
        }
      }

      if (sessionEmailsSent > 0) {
        logger.info(`Queued ${sessionEmailsSent} session reminder(s) for course ${course.id}`);
        processedSessions.push({
          sessionId: session.id,
          sessionTitle: session.title,
          reminderType: `${course.sessionReminderLeadHours}_HOURS`,
          emailsSent: sessionEmailsSent,
        });
      }
    }

    logger.info(
      `Session reminders processed. Total emails queued: ${totalEmailsSent}, not queued: ${totalEmailsFailed}`
    );

    return {
      success: true,
      messageKey: 'SESSION_REMINDERS_PROCESSED',
      totalEmailsSent,
      totalEmailsFailed,
      processedSessions,
      processedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(`Error sending session reminders: ${error.message}`, { error });
    // Retrying is safe: every reminder queued before the failure has its
    // MailLog row, so the retry skips those participants.
    return {
      success: false,
      retryable: true,
      error: error.message,
      messageKey: 'SESSION_REMINDERS_FAILED',
    };
  }
}
