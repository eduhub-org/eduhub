import { gql, GraphQLClient } from 'graphql-request';
import { appendGuestMailFooter } from '../guestRegistration.js';

/**
 * Generic function to queue emails
 * Handles template fetching, variable replacement, and MailLog insertion
 * 
 * @param {Object} params - Email queueing parameters
 * @param {string} params.templateType - Email template type (e.g., 'USER_CREATED', 'APPLICATION_RECEIVED')
 * @param {Function} params.variableReplacer - Function to replace template variables
 * @param {string} params.recipientEmail - Recipient email address
 * @param {number|null} params.courseId - Optional course ID for course-specific templates
 * @param {GraphQLClient} params.client - GraphQL client instance
 * @param {Object|null} params.recipientUser - Optional recipient User ({id, status}).
 *   When it is a guest, their manage link is appended: a guest has no account
 *   page, so that link is their only route to their own data.
 * @param {Object} params.logger - Logger instance
 * @returns {Promise<Object>} Result with mailId and success status
 */
async function queueEmail({
  templateType,
  variableReplacer,
  recipientEmail,
  courseId = null,
  recipientUser = null,
  client,
  logger
}) {
  // Validate required inputs
  if (!templateType || typeof templateType !== 'string' || templateType.trim() === '') {
    return {
      success: false,
      error: 'templateType is required and must be a non-empty string',
      messageKey: 'INVALID_TEMPLATE_TYPE'
    };
  }

  if (typeof variableReplacer !== 'function') {
    return {
      success: false,
      error: 'variableReplacer is required and must be a function',
      messageKey: 'INVALID_VARIABLE_REPLACER'
    };
  }

  if (!recipientEmail || typeof recipientEmail !== 'string' || recipientEmail.trim() === '') {
    return {
      success: false,
      error: 'recipientEmail is required and must be a non-empty string',
      messageKey: 'INVALID_RECIPIENT_EMAIL'
    };
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail.trim())) {
    return {
      success: false,
      error: 'recipientEmail must be a valid email address',
      messageKey: 'INVALID_EMAIL_FORMAT'
    };
  }

  if (!client || typeof client !== 'object' || typeof client.request !== 'function') {
    return {
      success: false,
      error: 'client is required and must be an object with a request method',
      messageKey: 'INVALID_CLIENT'
    };
  }

  if (!logger || typeof logger !== 'object' || typeof logger.error !== 'function' || typeof logger.info !== 'function') {
    return {
      success: false,
      error: 'logger is required and must be an object with error and info methods',
      messageKey: 'INVALID_LOGGER'
    };
  }

  try {
    // Get email template (course-specific or default)
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

    // Replace variables in template content. The subject is plain text, so
    // variables must not be HTML-escaped there (see createVariableReplacer).
    const emailSubject = variableReplacer(template.subject, { html: false });
    const emailContent = appendGuestMailFooter(
      variableReplacer(template.content),
      recipientUser,
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
      to: recipientEmail,
      cc: template.cc,
      bcc: template.bcc,
      status: 'READY_TO_SEND'
    });

    logger.info(`Email queued: template=${templateType}, recipient=${recipientEmail}, mailId=${mailResult.insert_MailLog_one.id}`);
    
    return {
      success: true,
      messageKey: 'EMAIL_QUEUED_SUCCESS',
      mailId: mailResult.insert_MailLog_one.id
    };

  } catch (error) {
    logger.error(`Error queueing email: ${error.message}`, { error });
    return {
      success: false,
      error: error.message,
      messageKey: 'EMAIL_QUEUE_FAILED'
    };
  }
}

export { queueEmail };

