import { gql, GraphQLClient } from 'graphql-request';
import { queueEmail } from '../lib/queueEmail.js';
import { withRetry } from '../lib/withRetry.js';
import { createEnrollmentVariableReplacer } from '../emailTemplateVariables.js';

/**
 * Sends emails for course-side changes:
 *   - send_payment_receipt_email on public.Invoice (UPDATE of status)
 *     -> PAYMENT_RECEIPT to the payer when an invoice becomes PAID (course/event
 *        enrollments only; job-posting invoices are skipped).
 *
 * Session rescheduling is NOT handled here any more. It is no longer automatic:
 * the Sessions tab asks the editor whether participants should be informed and
 * calls the notifySessionParticipants action, which uses
 * lib/sessionRescheduledEmail.js.
 *
 * The originating table is read from req.body.table.name.
 *
 * @param {Object} req - Request object from Hasura event trigger
 * @param {Object} logger - Winston logger instance
 * @returns {Object} Response object
 */
export default async function sendCourseUpdateEmail(req, logger) {
  logger.info('########## Send Course Update Email ##########');
  // Never log the raw body: Hasura event payloads carry full row data
  // (names, e-mail addresses, enrollment details). Allowlist metadata only.
  logger.debug(
    `Event: id=${req.body?.id} table=${req.body?.table?.name} op=${req.body?.event?.op}`
  );

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
