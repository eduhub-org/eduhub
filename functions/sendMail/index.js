const formData = require('form-data');
const Mailgun = require('mailgun.js');

/**
 * Responds to any HTTP request to send emails via Mailgun.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.sendMail = async (req, res) => {
  // Verify the request contains the correct secret header
  if (process.env.HASURA_CLOUD_FUNCTION_SECRET !== req.headers.secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Extract email parameters from the Hasura event payload
  const { subject, content, to, replyTo, cc, bcc } = req.body.event.data.new;
  
  // Get mail tag from headers or use default
  const mailTag = req.headers.mailTag || 'eduhub'; // default if not provided

  // Base message configuration
  const msg = {
    from: `noreply@${process.env.MAILGUN_DOMAIN}`,
    to,
    // Prepend '[STAGING]' to subject in staging environment
    subject: process.env.NODE_ENV === 'staging' ? '[STAGING] ' + subject : subject,
    text: content,
    html: content, // Support both plain text and HTML formats
    'o:tag': [mailTag], // Add tags for email categorization and tracking
    'o:tracking': true  // Enable Mailgun's email tracking features
  };

  // Add optional email parameters if provided
  if (replyTo) msg['h:Reply-To'] = replyTo;
  if (cc) msg.cc = cc;
  if (bcc) msg.bcc = bcc;

  try {
    switch (process.env.NODE_ENV) {
      case 'development':
        // Development mode: Log all email attempts without actually sending
        console.log('Development email:', {
          to: msg.to,
          from: msg.from,
          subject: msg.subject,
          text: msg.text,
          cc: msg.cc,
          bcc: msg.bcc,
          replyTo: msg['h:Reply-To']
        });
        break;
      case 'staging':
      case 'production':
        // Initialize Mailgun client and send email
        // Staging uses test domain with restricted recipients
        // Production uses regular Mailgun domain with full access
        const productionMailgun = new Mailgun(formData);
        await productionMailgun.client({
          username: 'api',
          key: process.env.MAILGUN_API_KEY,
          url: 'https://api.eu.mailgun.net'
        }).messages.create(process.env.MAILGUN_DOMAIN, msg);
        break;

      default:
        throw new Error('Invalid environment');
    }

    return res.json({ success: true });

  } catch (error) {
    // Log the error and return a 500 response with error details
    console.error('Email error:', error);
    return res.status(500).json({
      error: 'Failed to send email',
      details: error.message
    });
  }
};
