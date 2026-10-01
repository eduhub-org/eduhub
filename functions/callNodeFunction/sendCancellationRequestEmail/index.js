import { gql, GraphQLClient } from 'graphql-request';
import { createCancellationRequestVariableReplacer } from '../emailTemplateVariables.js';
import { queueEmail } from '../lib/queueEmail.js';

/**
 * Mails a cancellation request of a paid enrollment: to every organizer of the
 * course and every admin of its organization who manages that program type
 * (the same capability rule as the org_admin_access permissions), and a
 * confirmation to the participant.
 *
 * Fired by the send_cancellation_request_email event trigger when
 * CourseEnrollment.cancellationRequestedAt changes. Only the NULL -> timestamp
 * change is a request; the guard trigger lets a participant make it once, and
 * clears it (-> NULL) when they register again.
 *
 * Redelivery is safe: every mail carries the request in MailLog.metadata, and
 * a recipient who already has a mail for this request is skipped. The function
 * dispatcher answers 200 even on failure, so Hasura does not retry by itself;
 * redelivering the event from the Hasura event log after a partial failure
 * reaches exactly the recipients still missing.
 *
 * @param {Object} req - Request object from Hasura event trigger
 * @param {Object} logger - Winston logger instance
 * @returns {Object} Response object
 */
const GET_REQUEST_DETAILS = gql`
  query GetCancellationRequestDetails($enrollmentId: Int!) {
    CourseEnrollment_by_pk(id: $enrollmentId) {
      id
      isTest
      cancellationRequestedAt
      cancellationRequestReason
      User {
        id
        firstName
        lastName
        email
        status
      }
      Course {
        id
        title
        CourseInstructors {
          User {
            id
            firstName
            lastName
            email
          }
        }
        Program {
          type
          Organization {
            OrganizationAdmins {
              canManageCourses
              canManageEvents
              canManageDegrees
              canManageSettings
              User {
                id
                firstName
                lastName
                email
              }
            }
          }
        }
      }
    }
  }
`;

const SENT_FOR_REQUEST = gql`
  query CancellationRequestMailsSent($metadata: jsonb!) {
    MailLog(where: { metadata: { _contains: $metadata } }) {
      metadata
    }
  }
`;

const CAPABILITY_BY_PROGRAM_TYPE = {
  COURSES: 'canManageCourses',
  EVENTS: 'canManageEvents',
  DEGREES: 'canManageDegrees',
};

/**
 * Organizers first, then the organization admins who may manage the course
 * (and so can open its management page); one mail per address.
 */
export const collectOrganizerRecipients = (course, participantUserId) => {
  const capability = CAPABILITY_BY_PROGRAM_TYPE[course?.Program?.type];
  const admins = (course?.Program?.Organization?.OrganizationAdmins ?? [])
    .filter((grant) => grant.canManageSettings || (capability && grant[capability]))
    .map((grant) => grant.User);
  const instructors = (course?.CourseInstructors ?? []).map((instructor) => instructor.User);

  const seen = new Set();
  return [...instructors, ...admins].filter((user) => {
    const email = user?.email?.trim().toLowerCase();
    if (!email || user.id === participantUserId || seen.has(email)) return false;
    seen.add(email);
    return true;
  });
};

export default async function sendCancellationRequestEmail(req, logger) {
  logger.info('########## Send Cancellation Request Email ##########');

  try {
    const { op, data } = req.body.event;
    const requestedNow =
      op === 'UPDATE' && !data.old?.cancellationRequestedAt && !!data.new?.cancellationRequestedAt;
    if (!requestedNow || data.new?.isTest) {
      return { success: true, messageKey: 'NO_ACTION_NEEDED', message: 'Not a new cancellation request' };
    }

    const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
      headers: { 'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET },
    });

    const result = await client.request(GET_REQUEST_DETAILS, { enrollmentId: data.new.id });
    const enrollment = result?.CourseEnrollment_by_pk;
    // Withdrawn in the meantime (the participant registered again) or gone.
    if (!enrollment?.cancellationRequestedAt) {
      return { success: true, messageKey: 'NO_ACTION_NEEDED', message: 'Request no longer open' };
    }

    const { User: participant, Course: course } = enrollment;
    const frontendUrl = process.env.FRONTEND_URL || 'https://edu.opencampus.sh';
    const cancellation = {
      participantName: [participant?.firstName, participant?.lastName].filter(Boolean).join(' '),
      participantEmail: participant?.email || '',
      requestedAt: enrollment.cancellationRequestedAt,
      reason: enrollment.cancellationRequestReason || '',
      manageLink: `${frontendUrl}/manage/course/${course.id}`,
    };
    const formatDate = (value) =>
      new Date(value).toLocaleDateString('de-DE', {
        timeZone: 'Europe/Berlin',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

    const requestKey = {
      type: 'CANCELLATION_REQUEST',
      enrollmentId: enrollment.id,
      requestedAt: enrollment.cancellationRequestedAt,
    };
    const sent = await client.request(SENT_FOR_REQUEST, { metadata: requestKey });
    const alreadyMailed = new Set((sent?.MailLog ?? []).map((row) => row.metadata?.recipientUserId));

    const organizers = collectOrganizerRecipients(course, participant?.id);
    if (organizers.length === 0) {
      // Nobody to decide on it: the participant still gets the confirmation,
      // but this needs a human, so it is logged as an error.
      logger.error('Cancellation request has no organizer or organization admin to notify', {
        enrollmentId: enrollment.id,
        courseId: course.id,
      });
    }

    const mails = [
      ...organizers.map((user) => ({ user, templateType: 'CANCELLATION_REQUEST_ORGANIZER', recipientUser: null })),
      ...(participant?.email
        ? [{ user: participant, templateType: 'CANCELLATION_REQUEST_CONFIRMATION', recipientUser: participant }]
        : []),
    ];

    const failures = [];
    for (const { user, templateType, recipientUser } of mails) {
      if (alreadyMailed.has(user.id)) continue;
      const mailResult = await queueEmail({
        templateType,
        variableReplacer: createCancellationRequestVariableReplacer(user, course, cancellation, formatDate),
        recipientEmail: user.email,
        courseId: course.id,
        recipientUser,
        metadata: { ...requestKey, recipientUserId: user.id },
        client,
        logger,
      });
      // Logged per recipient rather than aborting, so everyone reachable is
      // reached; a redelivery then only mails the ones that failed.
      if (!mailResult.success) {
        failures.push(user.id);
        logger.error('Failed to queue cancellation request email', {
          enrollmentId: enrollment.id,
          templateType,
          recipientUserId: user.id,
          error: mailResult.error,
        });
      }
    }

    if (failures.length > 0) {
      return {
        success: false,
        error: `Cancellation request email failed for ${failures.length} recipient(s)`,
        messageKey: 'EMAIL_QUEUE_FAILED',
      };
    }

    logger.info('sendCancellationRequestEmail completed', {
      enrollmentId: enrollment.id,
      organizers: organizers.length,
    });
    return { success: true, messageKey: 'EMAILS_QUEUED', organizerCount: organizers.length };
  } catch (error) {
    logger.error(`Error in sendCancellationRequestEmail: ${error.message}`);
    throw error;
  }
}
