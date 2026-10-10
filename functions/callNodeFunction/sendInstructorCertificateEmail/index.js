import { gql, GraphQLClient } from 'graphql-request';
import { createVariableReplacer } from '../emailTemplateVariables.js';
import { queueEmail } from '../lib/queueEmail.js';

/**
 * Mails an instructor when their instructor certificate for a course has been issued, i.e. when
 * CourseInstructor.certificateURL is set for the first time. Regenerating a certificate (the URL
 * was already set) sends nothing.
 *
 * A failure to queue is returned as `retryable` so Hasura retries the event. The mail carries the
 * CourseInstructor id in MailLog.metadata under the unique index
 * MailLog_instructor_certificate_mail_unique, so a retry can never queue it twice.
 *
 * @param {Object} req - Request object from Hasura event trigger
 * @param {Object} logger - Winston logger instance
 * @returns {Object} Response object
 */
const GRAPHQL_REQUEST_TIMEOUT_MS = 30000;
const DEDUP_INDEX = 'MailLog_instructor_certificate_mail_unique';

export const isNewlyIssued = (event) =>
  event?.op === 'UPDATE' && !event.data?.old?.certificateURL && Boolean(event.data?.new?.certificateURL);

export default async function sendInstructorCertificateEmail(req, logger) {
  const start = Date.now();
  logger.info('########## Send Instructor Certificate Email ##########');

  try {
    const { event } = req.body;
    if (!isNewlyIssued(event)) {
      return { success: true, messageKey: 'NO_ACTION_NEEDED', message: 'Certificate not newly issued' };
    }

    const courseInstructorId = event.data.new.id;
    const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
      headers: { 'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET },
    });

    const GET_INSTRUCTOR_DETAILS = gql`
      query GetInstructorCertificateDetails($courseInstructorId: Int!) {
        CourseInstructor_by_pk(id: $courseInstructorId) {
          id
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
        document: GET_INSTRUCTOR_DETAILS,
        variables: { courseInstructorId },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const details = result?.CourseInstructor_by_pk;
    if (!details?.User?.email) {
      logger.error(`No instructor or email for CourseInstructor ${courseInstructorId}`);
      return { success: false, error: 'Instructor or email not found', messageKey: 'COURSE_INSTRUCTOR_NOT_FOUND' };
    }

    const { User, Course } = details;
    // The certificate is downloaded from the Course team card on the course management page.
    const courseLink = `${process.env.FRONTEND_URL || 'https://edu.opencampus.sh'}/manage/course/${Course.id}`;
    const variableReplacer = createVariableReplacer({ user: User, course: Course, enrollment: {}, courseLink }, () => '');

    const emailResult = await queueEmail({
      templateType: 'INSTRUCTOR_CERTIFICATE_READY',
      variableReplacer,
      recipientEmail: User.email,
      courseId: Course.id,
      metadata: { type: 'INSTRUCTOR_CERTIFICATE_READY', instructorCertificateCourseInstructorId: courseInstructorId },
      client,
      logger,
    });

    if (!emailResult.success) {
      if (String(emailResult.error).includes(DEDUP_INDEX)) {
        return { success: true, messageKey: 'NO_ACTION_NEEDED', message: 'Certificate email already queued' };
      }
      logger.error(`Failed to queue instructor certificate email: ${emailResult.error}`);
      return {
        success: false,
        retryable: true,
        error: emailResult.error,
        messageKey: emailResult.messageKey || 'EMAIL_QUEUE_FAILED',
      };
    }

    logger.info('sendInstructorCertificateEmail completed', {
      duration: Date.now() - start,
      courseId: Course.id,
      mailId: emailResult.mailId,
    });
    return { success: true, messageKey: 'EMAIL_QUEUED_SUCCESS', mailId: emailResult.mailId };
  } catch (error) {
    logger.error(`Error processing instructor certificate email: ${error.message}`, { error });
    return { success: false, retryable: true, error: error.message, messageKey: 'EMAIL_PROCESSING_FAILED' };
  }
}
