import { gql, GraphQLClient } from 'graphql-request';
import { createEnrollmentVariableReplacer } from '../emailTemplateVariables.js';
import { appendGuestMailFooter, guestSafeCopyRecipients } from '../guestRegistration.js';

/**
 * Sends enrollment status emails when CourseEnrollment status or invitationExpirationDate changes
 * 
 * @param {Object} req - Request object from Hasura event trigger
 * @param {Object} logger - Winston logger instance
 * @returns {Object} Response object
 */
export default async function sendEnrollmentEmail(req, logger) {
  logger.info("########## Send Enrollment Email ##########");
  logger.debug(`Request body: ${JSON.stringify(req.body)}`);

  try {
    const { event } = req.body;
    const { op, data } = event;
    
    // Only process insert and update operations
    if (op !== 'INSERT' && op !== 'UPDATE') {
      return {
        success: true,
        messageKey: 'NO_ACTION_NEEDED',
        message: 'No action needed for this operation'
      };
    }

    const enrollment = data.new;
    const oldEnrollment = data.old;

    // Create GraphQL client
    const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
      headers: {
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET,
      },
    });

    // Get enrollment details with user, course, and add-ons information
    const GET_ENROLLMENT_DETAILS = gql`
      query GetEnrollmentDetails($enrollmentId: Int!) {
        CourseEnrollment_by_pk(id: $enrollmentId) {
          id
          status
          created_at
          invitationExpirationDate
          achievementCertificateURL
          attendanceCertificateURL
          Invoices(limit: 1, order_by: { created_at: desc }) {
            status
          }
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
            startTime
            endTime
            basePrice
            currency
          }
          CourseEnrollmentAddons {
            id
            priceAtPurchase
            currency
            CourseAddonMapping {
              id
              description
            }
          }
        }
      }
    `;

    const enrollmentData = await client.request(GET_ENROLLMENT_DETAILS, {
      enrollmentId: enrollment.id
    });

    if (!enrollmentData?.CourseEnrollment_by_pk) {
      logger.error(`Enrollment not found: ${enrollment.id}`);
      return {
        success: false,
        error: 'Enrollment not found',
        messageKey: 'ENROLLMENT_NOT_FOUND'
      };
    }

    const enrollmentDetails = enrollmentData.CourseEnrollment_by_pk;

    // Get appropriate email template based on status
    // First try course-specific template, then fall back to default template
    const GET_EMAIL_TEMPLATE = gql`
      query GetEmailTemplate($type: MailTemplateType_enum!, $courseId: Int) {
        MailTemplate(
          where: {
            _and: [
              { type: { _eq: $type } }
              { courseId: { _eq: $courseId } }
            ]
          }
          limit: 1
        ) {
          id
          type
          courseId
          subject
          content
          from
          cc
          bcc
        }
      }
    `;

    // Detect a newly-issued certificate. The trigger also fires on updates to
    // achievementCertificateURL / attendanceCertificateURL, and certificate
    // issuance can happen without any status change. This takes priority over
    // the status-based mapping and is the signal that a course is completed
    // (there is deliberately no separate COURSE_COMPLETED email).
    const achievementNewlyIssued = !oldEnrollment?.achievementCertificateURL && !!enrollment.achievementCertificateURL;
    const attendanceNewlyIssued = !oldEnrollment?.attendanceCertificateURL && !!enrollment.attendanceCertificateURL;

    // certificateLink is passed into the variable replacer for [Enrollment:CertificateLink]
    let certificateLink = null;

    // Determine base template type
    let baseTemplateType;
    if (achievementNewlyIssued || attendanceNewlyIssued) {
      // Prefer achievement over attendance if both are set in the same update
      if (achievementNewlyIssued) {
        baseTemplateType = 'CERTIFICATE_ACHIEVEMENT_READY';
        certificateLink = enrollmentDetails.achievementCertificateURL;
      } else {
        baseTemplateType = 'CERTIFICATE_ATTENDANCE_READY';
        certificateLink = enrollmentDetails.attendanceCertificateURL;
      }
    } else {
      // A waitlisted user who is moved up to INVITED/CONFIRMED gets the
      // "a spot opened up" email instead of the plain invite/confirmation.
      const promotedFromWaitlist =
        op === 'UPDATE' &&
        oldEnrollment?.status === 'WAITLIST' &&
        (enrollment.status === 'INVITED' || enrollment.status === 'CONFIRMED');

      if (promotedFromWaitlist) {
        baseTemplateType = 'WAITLIST_PROMOTED';
      } else {
        switch (enrollment.status) {
          case 'APPLIED':
            baseTemplateType = 'APPLICATION_RECEIVED';
            break;
          case 'CONFIRMED':
            baseTemplateType = 'APPLICATION_CONFIRMED';
            break;
          case 'INVITED':
            baseTemplateType = 'INVITE';
            break;
          case 'REJECTED':
            baseTemplateType = 'DECLINE';
            break;
          case 'REGISTERED':
            baseTemplateType = 'REGISTRATION_CONFIRMED';
            break;
          case 'WAITLIST':
            baseTemplateType = 'WAITLIST_NOTICE';
            break;
          case 'CANCELLED':
            baseTemplateType = 'ENROLLMENT_CANCELLED';
            break;
          case 'ABORTED':
            baseTemplateType = 'ENROLLMENT_ABORTED';
            break;
          case 'EXPIRED':
            baseTemplateType = 'INVITATION_EXPIRED';
            break;
          default:
            // Don't send emails for other status changes (e.g. COMPLETED —
            // completion is signalled by the certificate email above).
            return {
              success: true,
              messageKey: 'NO_TEMPLATE_FOR_STATUS',
              message: `No email template for status: ${enrollment.status}`
            };
        }
      }
    }

    // Select paid template variant if latest invoice is paid
    // (CourseEnrollment.paymentStatus was removed in favor of Invoice.status)
    let templateType = baseTemplateType;
    const latestInvoiceStatus = enrollmentDetails.Invoices?.[0]?.status;
    const isPaid = latestInvoiceStatus === 'PAID';
    if (isPaid) {
      if (baseTemplateType === 'REGISTRATION_CONFIRMED') {
        templateType = 'REGISTRATION_CONFIRMED_PAID';
      } else if (baseTemplateType === 'APPLICATION_RECEIVED') {
        templateType = 'APPLICATION_RECEIVED_PAID';
      }
    }

    // Get courseId from enrollment
    const courseId = enrollmentDetails.Course?.id;

    // First try to get course-specific template
    let templateData = await client.request(GET_EMAIL_TEMPLATE, {
      type: templateType,
      courseId: courseId
    });

    // If no course-specific template found, fall back to default template (courseId = NULL)
    if (!templateData?.MailTemplate?.length) {
      const GET_DEFAULT_TEMPLATE = gql`
        query GetDefaultTemplate($type: MailTemplateType_enum!) {
          MailTemplate(
            where: {
              _and: [
                { type: { _eq: $type } }
                { courseId: { _is_null: true } }
              ]
            }
            limit: 1
          ) {
            id
            type
            courseId
            subject
            content
            from
            cc
            bcc
          }
        }
      `;
      templateData = await client.request(GET_DEFAULT_TEMPLATE, {
        type: templateType
      });
    }

    if (!templateData?.MailTemplate?.length) {
      logger.error(`Email template not found: ${templateType} for courseId: ${courseId || 'default'}`);
      return {
        success: false,
        error: `Email template not found: ${templateType}`,
        messageKey: 'TEMPLATE_NOT_FOUND'
      };
    }

    const template = templateData.MailTemplate[0];

    // Get app settings for locale determination
    const GET_APP_SETTINGS = gql`
      query GetAppSettings($appName: String!) {
        AppSettings(where: { appName: { _eq: $appName } }) {
          timeZone
        }
      }
    `;

    const appSettingsData = await client.request(GET_APP_SETTINGS, {
      appName: 'edu'
    });

    // Map timezone to appropriate locale for date formatting
    const getLocaleFromTimeZone = (timeZone) => {
      const timezoneLocaleMap = {
        'Europe/Berlin': 'de-DE',
        'Europe/London': 'en-GB', 
        'Europe/Paris': 'fr-FR',
        'America/New_York': 'en-US',
        'America/Los_Angeles': 'en-US',
        'Asia/Tokyo': 'ja-JP',
        'UTC': 'en-US'
      };
      return timezoneLocaleMap[timeZone] || 'de-DE'; // Default to German locale
    };

    const appTimeZone = appSettingsData?.AppSettings?.[0]?.timeZone || 'Europe/Berlin';
    const locale = getLocaleFromTimeZone(appTimeZone);

    // Replace placeholders in email content using centralized system
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Expose the certificate link (when a certificate was just issued) to the replacer
    enrollmentDetails.certificateLink = certificateLink;

    const replaceVariables = createEnrollmentVariableReplacer(enrollmentDetails, formatDate);

    // The subject is plain text, so variables must not be HTML-escaped there
    const emailSubject = replaceVariables(template.subject, { html: false });
    // An anonymized recipient has a placeholder address that goes nowhere, so a
    // mail queued for them is dead on arrival. This happens for real: the
    // enrollment trigger is asynchronous, so a guest erasing their data has
    // their enrollments cancelled and the row anonymized before the trigger
    // runs, and the retention cron leaves past enrollments in place on records
    // it has already anonymized.
    if (enrollmentDetails.User?.status === 'DELETED') {
      logger.info(
        `Skipping ${templateType} for enrollment ${enrollment.id}: the recipient is anonymized`
      );
      return { success: true, messageKey: 'RECIPIENT_ANONYMIZED', skipped: true };
    }

    const emailContent = appendGuestMailFooter(
      replaceVariables(template.content),
      enrollmentDetails.User,
      logger
    );

    // Insert email into MailLog for sending
    const INSERT_MAIL_LOG = gql`
      mutation InsertMailLog(
        $subject: String!
        $content: String!
        $from: String!
        $to: String!
        $cc: String
        $bcc: String
        $status: String!
      ) {
        insert_MailLog_one(
          object: {
            subject: $subject
            content: $content
            from: $from
            to: $to
            cc: $cc
            bcc: $bcc
            status: $status
          }
        ) {
          id
        }
      }
    `;

    const mailResult = await client.request(INSERT_MAIL_LOG, {
      subject: emailSubject,
      content: emailContent,
      from: template.from || 'noreply@opencampus.sh',
      to: enrollmentDetails.User.email,
      ...guestSafeCopyRecipients(enrollmentDetails.User, {
        cc: template.cc,
        bcc: template.bcc,
      }),
      status: 'READY_TO_SEND'
    });

    logger.info(`Email queued for enrollment ${enrollment.id}, status: ${enrollment.status}, operation: ${op}, mailId: ${mailResult.insert_MailLog_one.id}`);
    
    return {
      success: true,
      messageKey: 'EMAIL_QUEUED_SUCCESS',
      mailId: mailResult.insert_MailLog_one.id,
      enrollmentId: enrollment.id,
      status: enrollment.status
    };

  } catch (error) {
    logger.error(`Error processing enrollment email: ${error.message}`, { error });
    return {
      success: false,
      error: error.message,
      messageKey: 'EMAIL_PROCESSING_FAILED'
    };
  }
} 