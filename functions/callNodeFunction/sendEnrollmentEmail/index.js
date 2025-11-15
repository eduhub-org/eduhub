import { gql, GraphQLClient } from 'graphql-request';
import { createEnrollmentVariableReplacer } from '../emailTemplateVariables.js';

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
    // First try course-specific template, then fall back to default template
    const GET_EMAIL_TEMPLATE = gql`
      query GetEmailTemplate($type: String!, $courseId: Int) {
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

    let templateType;
    switch (enrollment.status) {
      case 'APPLIED':
        templateType = 'APPLICATION_RECEIVED';
        break;
      case 'CONFIRMED':
        templateType = 'APPLICATION_CONFIRMED';
        break;
      case 'INVITED':
        templateType = 'INVITE';
        break;
      case 'REJECTED':
        templateType = 'DECLINE';
        break;
      case 'REGISTERED':
        templateType = 'REGISTRATION_CONFIRMED';
        break;
      default:
        // Don't send emails for other status changes
        return {
          success: true,
          messageKey: 'NO_TEMPLATE_FOR_STATUS',
          message: `No email template for status: ${enrollment.status}`
        };
    }

    // Get courseId from enrollment
    const courseId = enrollmentDetails.Course?.id;

    // First try to get course-specific template
    let templateData = await client.request(GET_EMAIL_TEMPLATE, {
      type: templateType,
      courseId: courseId
    });

    // If no course-specific template found, fall back to default template (courseId = -1)
    if (!templateData?.MailTemplate?.length) {
      templateData = await client.request(GET_EMAIL_TEMPLATE, {
        type: templateType,
        courseId: -1
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
      cc: template.cc,
      bcc: template.bcc,
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