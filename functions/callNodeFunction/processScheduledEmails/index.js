import { gql, GraphQLClient } from 'graphql-request';
const formData = require('form-data');
const Mailgun = require('mailgun.js');

/**
 * Processes scheduled emails that are ready to be sent
 * Sends emails directly via Mailgun API (bypassing Hasura trigger to prevent duplicates)
 * Updates MailLog status after sending
 * 
 * @param {Object} req - Request object from cron trigger
 * @param {Object} logger - Winston logger instance
 * @returns {Object} Response object with processing results
 */
export default async function processScheduledEmails(req, logger) {
  logger.info("########## Process Scheduled Emails ##########");
  logger.debug(`Request body: ${JSON.stringify(req.body)}`);

  try {
    // Create GraphQL client
    const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
      headers: {
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET,
      },
    });

    const now = new Date();

    // Query for emails that are scheduled and ready to send
    const GET_SCHEDULED_EMAILS = gql`
      query GetScheduledEmails($now: timestamptz!) {
        MailLog(
          where: {
            _and: [
              { scheduledAt: { _lte: $now } }
              { status: { _eq: "UNSENT" } }
            ]
          }
          limit: 100
        ) {
          id
          subject
          content
          from
          to
          cc
          bcc
          scheduledAt
        }
      }
    `;

    const scheduledEmailsData = await client.request(GET_SCHEDULED_EMAILS, {
      now: now.toISOString()
    });

    if (!scheduledEmailsData?.MailLog?.length) {
      logger.info('No scheduled emails ready to send');
      return {
        success: true,
        messageKey: 'NO_SCHEDULED_EMAILS',
        emailsProcessed: 0,
        emailsSent: 0,
        emailsFailed: 0
      };
    }

    const emails = scheduledEmailsData.MailLog;
    logger.info(`Found ${emails.length} scheduled emails ready to send`);

    let emailsSent = 0;
    let emailsFailed = 0;
    const results = [];

    // Initialize Mailgun client
    const mailgun = new Mailgun(formData);
    const mailgunClient = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY,
      url: 'https://api.eu.mailgun.net'
    });

    // Process each email
    for (const email of emails) {
      try {
        // Prepare email message
        const msg = {
          from: email.from || `noreply@${process.env.MAILGUN_DOMAIN}`,
          to: email.to,
          subject: process.env.NODE_ENV === 'staging' ? '[STAGING] ' + email.subject : email.subject,
          text: email.content,
          html: email.content,
          'o:tag': ['eduhub', 'scheduled'],
          'o:tracking': true
        };

        if (email.cc) msg.cc = email.cc;
        if (email.bcc) msg.bcc = email.bcc;

        // Send email via Mailgun (only in staging/production)
        if (process.env.NODE_ENV === 'development') {
          logger.info('Development mode: Would send email', {
            to: msg.to,
            from: msg.from,
            subject: msg.subject
          });
        } else {
          await mailgunClient.messages.create(process.env.MAILGUN_DOMAIN, msg);
        }

        // Update MailLog status to SENT
        const UPDATE_MAIL_LOG = gql`
          mutation UpdateMailLog($id: Int!, $status: String!) {
            update_MailLog_by_pk(
              pk_columns: { id: $id }
              _set: { status: $status, scheduledAt: null }
            ) {
              id
              status
            }
          }
        `;

        await client.request(UPDATE_MAIL_LOG, {
          id: email.id,
          status: 'SENT'
        });

        emailsSent++;
        results.push({
          mailId: email.id,
          recipient: email.to,
          status: 'sent'
        });

        logger.info(`Successfully sent scheduled email ${email.id} to ${email.to}`);

      } catch (error) {
        logger.error(`Error sending scheduled email ${email.id}: ${error.message}`, { error });

        // Update MailLog status to SENDING_ERROR
        try {
          const UPDATE_MAIL_LOG_ERROR = gql`
            mutation UpdateMailLogError($id: Int!, $status: String!) {
              update_MailLog_by_pk(
                pk_columns: { id: $id }
                _set: { status: $status }
              ) {
                id
                status
              }
            }
          `;

          await client.request(UPDATE_MAIL_LOG_ERROR, {
            id: email.id,
            status: 'SENDING_ERROR'
          });
        } catch (updateError) {
          logger.error(`Error updating MailLog status for ${email.id}: ${updateError.message}`);
        }

        emailsFailed++;
        results.push({
          mailId: email.id,
          recipient: email.to,
          status: 'failed',
          error: error.message
        });
      }
    }

    logger.info(`Scheduled emails processing completed. Sent: ${emailsSent}, Failed: ${emailsFailed}`);

    return {
      success: true,
      messageKey: 'SCHEDULED_EMAILS_PROCESSED',
      emailsProcessed: emails.length,
      emailsSent,
      emailsFailed,
      results,
      processedAt: now.toISOString()
    };

  } catch (error) {
    logger.error(`Error processing scheduled emails: ${error.message}`, { error });
    return {
      success: false,
      error: error.message,
      messageKey: 'SCHEDULED_EMAILS_PROCESSING_FAILED'
    };
  }
}

