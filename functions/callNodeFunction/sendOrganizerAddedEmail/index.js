import { gql, GraphQLClient } from 'graphql-request';
import { createVariableReplacer } from '../emailTemplateVariables.js';
import { queueEmail } from '../lib/queueEmail.js';

/**
 * Sends an email when a user is added as an organizer (instructor) to a course or event.
 * Uses "organizer" terminology to cover both courses and events.
 *
 * A failure to queue is returned as `retryable`, so the dispatcher answers with
 * a non-2xx status and Hasura retries the event (retry_conf on the
 * send_organizer_added_email trigger). The mail carries the CourseInstructor id
 * in MailLog.metadata under the unique index MailLog_organizer_added_mail_unique,
 * so a retry or a duplicate delivery can never queue it twice.
 *
 * @param {Object} req - Request object from Hasura event trigger
 * @param {Object} logger - Winston logger instance
 * @returns {Object} Response object
 */
const GRAPHQL_REQUEST_TIMEOUT_MS = 30000;
const DEDUP_INDEX = 'MailLog_organizer_added_mail_unique';

export default async function sendOrganizerAddedEmail(req, logger) {
  const start = Date.now();
  logger.info('########## Send Organizer Added Email ##########');
  logger.debug('Request (sanitized)', {
    op: req.body?.event?.op,
    newId: req.body?.event?.data?.new?.id,
    userId: req.body?.session_variables?.['x-hasura-user-id'],
  });

  try {
    const { event } = req.body;
    const { op, data } = event;

    if (op !== 'INSERT') {
      logger.info('sendOrganizerAddedEmail completed', { duration: Date.now() - start });
      return {
        success: true,
        messageKey: 'NO_ACTION_NEEDED',
        message: 'No action needed for this operation',
      };
    }

    const courseInstructor = data.new;

    const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
      headers: {
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET,
      },
    });

    const GET_ORGANIZER_DETAILS = gql`
      query GetOrganizerDetails($courseInstructorId: Int!) {
        CourseInstructor_by_pk(id: $courseInstructorId) {
          id
          courseId
          userId
          User {
            id
            firstName
            lastName
            email
          }
          Course {
            id
            title
            Program {
              title
              shortTitle
              type
            }
          }
        }
      }
    `;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GRAPHQL_REQUEST_TIMEOUT_MS);
    let result;
    try {
      result = await client.request({
        document: GET_ORGANIZER_DETAILS,
        variables: { courseInstructorId: courseInstructor.id },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const details = result?.CourseInstructor_by_pk;
    if (!details) {
      logger.error(`CourseInstructor not found: ${courseInstructor.id}`, { duration: Date.now() - start });
      return {
        success: false,
        error: 'CourseInstructor not found',
        messageKey: 'COURSE_INSTRUCTOR_NOT_FOUND',
      };
    }

    const { User, Course } = details;
    if (!User?.email) {
      logger.error(`Organizer has no email: userId=${details.userId}`, { duration: Date.now() - start });
      return {
        success: false,
        error: 'Organizer has no email address',
        messageKey: 'ORGANIZER_NO_EMAIL',
      };
    }

    const courseLink = `${process.env.FRONTEND_URL || 'https://edu.opencampus.sh'}/manage/course/${Course.id}`;

    // ORGANIZER_ADDED template uses only Course-level placeholders ([Enrollment:CourseId--Course:Name],
    // [Enrollment:CourseLink]). enrollment is empty and formatDate is a no-op by design.
    const formatDate = () => '';
    const variableReplacer = createVariableReplacer(
      {
        user: User,
        course: Course,
        enrollment: {},
        courseLink,
      },
      formatDate
    );

    const emailResult = await queueEmail({
      templateType: 'ORGANIZER_ADDED',
      variableReplacer,
      recipientEmail: User.email,
      courseId: Course.id,
      metadata: { type: 'ORGANIZER_ADDED', courseInstructorId: courseInstructor.id },
      client,
      logger,
    });

    if (!emailResult.success) {
      // An earlier delivery of this event already queued the mail.
      if (String(emailResult.error).includes(DEDUP_INDEX)) {
        return {
          success: true,
          messageKey: 'NO_ACTION_NEEDED',
          message: 'Organizer added email already queued for this event',
        };
      }
      logger.error(`Failed to queue organizer added email: ${emailResult.error}`, { duration: Date.now() - start });
      return {
        success: false,
        retryable: true,
        error: emailResult.error,
        messageKey: emailResult.messageKey || 'EMAIL_QUEUE_FAILED',
      };
    }

    logger.info('sendOrganizerAddedEmail completed', {
      duration: Date.now() - start,
      courseId: Course.id,
      mailId: emailResult.mailId,
    });

    return {
      success: true,
      messageKey: 'EMAIL_QUEUED_SUCCESS',
      mailId: emailResult.mailId,
      courseInstructorId: courseInstructor.id,
    };
  } catch (error) {
    logger.error(`Error processing organizer added email: ${error.message}`, {
      error,
      duration: Date.now() - start,
    });
    return {
      success: false,
      retryable: true,
      error: error.message,
      messageKey: 'EMAIL_PROCESSING_FAILED',
    };
  }
}
