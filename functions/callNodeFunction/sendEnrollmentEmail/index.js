import { gql, GraphQLClient } from 'graphql-request';
import { createEnrollmentVariableReplacer } from '../emailTemplateVariables.js';

/**
 * Sends enrollment status emails when CourseEnrollment status changes
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

    // For updates, only send email if status actually changed
    if (op === 'UPDATE' && oldEnrollment && oldEnrollment.status === enrollment.status) {
      return {
        success: true,
        messageKey: 'STATUS_UNCHANGED',
        message: 'Status unchanged, no email needed'
      };
    }

    // Create GraphQL client
    const client = new GraphQLClient(process.env.HASURA_GRAPHQL_ENDPOINT, {
      headers: {
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET,
      },
    });

    // Get enrollment details with user and course information
    const GET_ENROLLMENT_DETAILS = gql`
      query GetEnrollmentDetails($enrollmentId: Int!) {
        CourseEnrollment_by_pk(id: $enrollmentId) {
          id
          status
          created_at
          invitationExpirationDate
          User {
            id
            firstName
            lastName
            email
          }
          Course {
            id
            title
            startTime
            endTime
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
    const GET_EMAIL_TEMPLATE = gql`
      query GetEmailTemplate($title: String!) {
        MailTemplate(where: { title: { _eq: $title } }) {
          id
          subject
          content
          from
          cc
          bcc
        }
      }
    `;

    let templateTitle;
    switch (enrollment.status) {
      case 'APPLIED':
        templateTitle = 'APPLICATION_RECEIVED';
        break;
      case 'CONFIRMED':
        templateTitle = 'APPLICATION_CONFIRMED';
        break;
      case 'INVITED':
        templateTitle = 'INVITE';
        break;
      case 'REJECTED':
        templateTitle = 'DECLINE';
        break;
      case 'REGISTERED':
        templateTitle = 'REGISTRATION_CONFIRMED';
        break;
      default:
        // Don't send emails for other status changes
        return {
          success: true,
          messageKey: 'NO_TEMPLATE_FOR_STATUS',
          message: `No email template for status: ${enrollment.status}`
        };
    }

    const templateData = await client.request(GET_EMAIL_TEMPLATE, {
      title: templateTitle
    });

    if (!templateData?.MailTemplate?.length) {
      logger.error(`Email template not found: ${templateTitle}`);
      return {
        success: false,
        error: `Email template not found: ${templateTitle}`,
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

    const replaceVariables = createEnrollmentVariableReplacer(enrollmentDetails, formatDate);

    const emailSubject = replaceVariables(template.subject);
    const emailContent = replaceVariables(template.content);

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
        $metadata: jsonb
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
            metadata: $metadata
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
      cc: template.cc,
      bcc: template.bcc,
      status: 'READY_TO_SEND',
      metadata: {
        type: 'ENROLLMENT_STATUS',
        enrollmentId: enrollment.id,
        userId: enrollmentDetails.User.id,
        courseId: enrollmentDetails.Course.id,
        statusChange: {
          from: oldEnrollment?.status || null,
          to: enrollment.status
        },
        sentAt: new Date().toISOString()
      }
    });

    logger.info(`Email queued for enrollment ${enrollment.id}, status: ${enrollment.status}, mailId: ${mailResult.insert_MailLog_one.id}`);
    
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