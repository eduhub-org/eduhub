import { gql, GraphQLClient } from 'graphql-request';
import { queueEmail } from '../lib/queueEmail.js';
import { withRetry } from '../lib/withRetry.js';
import { createVariableReplacer, createEnrollmentVariableReplacer } from '../emailTemplateVariables.js';

/**
 * Sends emails for course-side changes:
 *   - send_session_rescheduled_email on public.Session (UPDATE of startDateTime/endDateTime)
 *     -> SESSION_RESCHEDULED to active (CONFIRMED/REGISTERED) enrollees of the course.
 *   - send_payment_receipt_email on public.Invoice (UPDATE of status)
 *     -> PAYMENT_RECEIPT to the payer when an invoice becomes PAID (course/event
 *        enrollments only; job-posting invoices are skipped).
 *
 * The originating table is read from req.body.table.name.
 *
 * @param {Object} req - Request object from Hasura event trigger
 * @param {Object} logger - Winston logger instance
 * @returns {Object} Response object
 */
export default async function sendCourseUpdateEmail(req, logger) {
  logger.info('########## Send Course Update Email ##########');
  logger.debug(`Request body: ${JSON.stringify(req.body)}`);

  try {
    const { event, table } = req.body;
    const { op, data } = event;
    const tableName = table?.name;

    if (op !== 'UPDATE') {
      return { success: true, messageKey: 'NO_ACTION_NEEDED', message: 'Only UPDATE is handled' };
    }

    const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
      headers: { 'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET },
    });

    const formatDate = (dateString) =>
      dateString ? new Date(dateString).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
    const formatDateTime = (dateString) =>
      dateString ? new Date(dateString).toLocaleString('de-DE', { dateStyle: 'long', timeStyle: 'short' }) : '';
    const formatTime = (dateString) =>
      dateString ? new Date(dateString).toLocaleTimeString('de-DE', { timeStyle: 'short' }) : '';

    if (tableName === 'Session') {
      const sessionNew = data.new;
      const sessionOld = data.old;

      // Only notify when the timing actually changed.
      const timingChanged =
        sessionNew.startDateTime !== sessionOld?.startDateTime ||
        sessionNew.endDateTime !== sessionOld?.endDateTime;
      if (!timingChanged) {
        return { success: true, messageKey: 'NO_ACTION_NEEDED', message: 'Session timing unchanged' };
      }

      const courseId = sessionNew.courseId;
      const GET_ENROLLEES = gql`
        query GetActiveEnrollees($courseId: Int!) {
          Course_by_pk(id: $courseId) {
            id
            title
            CourseEnrollments(where: { status: { _in: [CONFIRMED, REGISTERED] } }) {
              User { id email firstName lastName }
            }
          }
        }
      `;
      const courseData = await withRetry(() => client.request(GET_ENROLLEES, { courseId }), {
        logger,
        description: `enrollee lookup for course ${courseId}`,
      });
      const course = courseData?.Course_by_pk;
      if (!course) {
        return { success: false, error: 'Course not found', messageKey: 'COURSE_NOT_FOUND' };
      }

      const recipients = (course.CourseEnrollments || []).map((e) => e.User).filter((u) => u?.email);
      const seen = new Set();
      const uniqueRecipients = recipients.filter((u) => (seen.has(u.email) ? false : (seen.add(u.email), true)));

      if (uniqueRecipients.length === 0) {
        return { success: true, messageKey: 'NO_RECIPIENTS', message: 'No active enrollees to notify' };
      }

      const formattedStart = formatDateTime(sessionNew.startDateTime);
      // The trigger also fires on end-time-only changes, so the mail has to show
      // the end time too. Same-day sessions only need the clock time for it.
      const endsOnStartDay =
        sessionNew.startDateTime &&
        sessionNew.endDateTime &&
        new Date(sessionNew.startDateTime).toDateString() === new Date(sessionNew.endDateTime).toDateString();
      const formattedEnd = endsOnStartDay ? formatTime(sessionNew.endDateTime) : formatDateTime(sessionNew.endDateTime);
      let queued = 0;
      for (const user of uniqueRecipients) {
        const replacer = createVariableReplacer(
          {
            user,
            course: { id: course.id, title: course.title },
            session: { title: sessionNew.title, startDateTime: formattedStart, endDateTime: formattedEnd },
            courseLink: `${process.env.FRONTEND_URL || 'https://edu.opencampus.sh'}/course/${course.id}`,
          },
          formatDate
        );
        const result = await queueEmail({
          templateType: 'SESSION_RESCHEDULED',
          variableReplacer: replacer,
          recipientEmail: user.email,
          courseId: course.id,
          client,
          logger,
        });
        if (result?.success) queued += 1;
      }

      logger.info(`SESSION_RESCHEDULED for course ${course.id}: queued ${queued}/${uniqueRecipients.length}`);
      return { success: true, messageKey: 'SESSION_RESCHEDULED_QUEUED', queued, total: uniqueRecipients.length };
    }

    if (tableName === 'Invoice') {
      const invoiceNew = data.new;
      const invoiceOld = data.old;

      // Only on transition into PAID, and only for course/event enrollments
      // (job-posting invoices have their own StuJo emails).
      if (invoiceNew.status !== 'PAID' || invoiceOld?.status === 'PAID') {
        return { success: true, messageKey: 'NO_ACTION_NEEDED', message: 'Invoice not newly paid' };
      }
      if (!invoiceNew.courseEnrollmentId) {
        return { success: true, messageKey: 'NO_ACTION_NEEDED', message: 'Invoice not linked to a course enrollment' };
      }

      const GET_ENROLLMENT = gql`
        query GetEnrollmentForReceipt($enrollmentId: Int!) {
          CourseEnrollment_by_pk(id: $enrollmentId) {
            id
            created_at
            invitationExpirationDate
            User { id email firstName lastName }
            Course { id title startTime endTime basePrice currency }
            CourseEnrollmentAddons {
              id
              priceAtPurchase
              currency
              CourseAddonMapping { id description }
            }
          }
        }
      `;
      const enrollmentData = await withRetry(
        () => client.request(GET_ENROLLMENT, { enrollmentId: invoiceNew.courseEnrollmentId }),
        { logger, description: `enrollment ${invoiceNew.courseEnrollmentId} lookup` }
      );
      const enrollmentDetails = enrollmentData?.CourseEnrollment_by_pk;
      if (!enrollmentDetails?.User?.email) {
        return { success: false, error: 'Enrollment/recipient not found', messageKey: 'ENROLLMENT_NOT_FOUND' };
      }

      const replacer = createEnrollmentVariableReplacer(enrollmentDetails, formatDate);
      const result = await queueEmail({
        templateType: 'PAYMENT_RECEIPT',
        variableReplacer: replacer,
        recipientEmail: enrollmentDetails.User.email,
        courseId: enrollmentDetails.Course?.id ?? null,
        client,
        logger,
      });

      return {
        success: !!result?.success,
        messageKey: result?.success ? 'PAYMENT_RECEIPT_QUEUED' : 'PAYMENT_RECEIPT_FAILED',
        mailId: result?.mailId,
      };
    }

    return { success: true, messageKey: 'NO_ACTION_NEEDED', message: `Unhandled table: ${tableName}` };
  } catch (error) {
    logger.error(`Error processing course update email: ${error.message}`, { error });
    return { success: false, error: error.message, messageKey: 'COURSE_UPDATE_EMAIL_FAILED' };
  }
}
