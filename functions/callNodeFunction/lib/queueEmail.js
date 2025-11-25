const { gql, GraphQLClient } = require('graphql-request');

/**
 * Generic function to queue emails with optional scheduling
 * Handles template fetching, variable replacement, and MailLog insertion
 * 
 * @param {Object} params - Email queueing parameters
 * @param {string} params.templateType - Email template type (e.g., 'USER_CREATED', 'APPLICATION_RECEIVED')
 * @param {Function} params.variableReplacer - Function to replace template variables
 * @param {string} params.recipientEmail - Recipient email address
 * @param {number|null} params.courseId - Optional course ID for course-specific templates
 * @param {Date|null} params.scheduledAt - Optional scheduled send time (for delayed emails)
 * @param {GraphQLClient} params.client - GraphQL client instance
 * @param {Object} params.logger - Logger instance
 * @returns {Promise<Object>} Result with mailId and success status
 */
async function queueEmail({
  templateType,
  variableReplacer,
  recipientEmail,
  courseId = null,
  scheduledAt = null,
  client,
  logger
}) {
  try {
    // Get email template (course-specific or default)
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

    // First try to get course-specific template
    let templateData = await client.request(GET_EMAIL_TEMPLATE, {
      type: templateType,
      courseId: courseId
    });

    // If no course-specific template found, fall back to default template (courseId = NULL)
    if (!templateData?.MailTemplate?.length) {
      const GET_DEFAULT_TEMPLATE = gql`
        query GetDefaultTemplate($type: String!) {
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

    // Replace variables in template content
    const emailSubject = variableReplacer(template.subject);
    const emailContent = variableReplacer(template.content);

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
        $scheduledAt: timestamptz
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
            scheduledAt: $scheduledAt
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
      status: 'UNSENT',
      scheduledAt: scheduledAt ? scheduledAt.toISOString() : null
    });

    logger.info(`Email queued: template=${templateType}, recipient=${recipientEmail}, scheduledAt=${scheduledAt || 'immediate'}, mailId=${mailResult.insert_MailLog_one.id}`);
    
    return {
      success: true,
      messageKey: 'EMAIL_QUEUED_SUCCESS',
      mailId: mailResult.insert_MailLog_one.id,
      scheduledAt: scheduledAt
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

module.exports = { queueEmail };

