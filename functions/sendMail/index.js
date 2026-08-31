const formData = require('form-data');
const Mailgun = require('mailgun.js');
let secretsMatch;
try {
  ({ secretsMatch } = require('./shared_libs/node/security.cjs'));
} catch {
  ({ secretsMatch } = require('../shared_libs/node/security.cjs'));
}

// Mailgun accepts up to 25 MB, but this function runs with 256M of memory and
// form-data buffers a second multipart copy of every attachment. A Stripe
// invoice PDF is ~30-60 KB, so 8 MB is generous; raising this needs a matching
// available_memory bump in infrastructure/application/06_cloud-functions.tf.
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15000;
const RETRY_DELAY_MS = 250;
// Only Stripe invoice documents today. MailLog is admin-write-only, so this is
// defence in depth rather than a live hole -- but without it any future path
// that lets a user-controlled URL reach the column would turn this function
// into an SSRF proxy with its own egress.
const ATTACHMENT_HOST_SUFFIXES = ['.stripe.com'];

function isAllowedAttachmentUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;

  // The public bucket is opt-in via env, so certificates and similar documents
  // can be attached later without touching this list.
  const bucketUrl = process.env.STORAGE_BUCKET_PUBLIC_URL;
  if (bucketUrl) {
    try {
      if (new URL(bucketUrl).hostname === url.hostname) return true;
    } catch {
      // A malformed env var must never widen the allowlist.
    }
  }

  // Match the bare host too, so 'stripe.com' passes while an attacker-owned
  // 'x.stripe.com.evil.net' does not.
  return ATTACHMENT_HOST_SUFFIXES.some(
    (suffix) => url.hostname === suffix.slice(1) || url.hostname.endsWith(suffix)
  );
}

function safeAttachmentFilename(name, fallback) {
  const cleaned = String(name || '')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^[._]+/, '')
    .slice(0, 120);
  return cleaned || fallback;
}

/**
 * Downloads the descriptors in MailLog.attachments into Mailgun CustomFile
 * objects ({data, filename, contentType}).
 *
 * A descriptor that cannot be fetched is skipped, never thrown. The Hasura
 * trigger retries 10x at 61-minute intervals, so failing here would delay the
 * mail by up to ten hours or lose it entirely, and every template that carries
 * an attachment also links the same document. Sending without the file is
 * strictly better than not sending; the error log is the signal.
 */
async function resolveAttachments(descriptors, mailId) {
  if (!Array.isArray(descriptors) || descriptors.length === 0) return [];

  const files = [];
  let totalBytes = 0;

  for (const [index, descriptor] of descriptors.entries()) {
    const url = descriptor && descriptor.url;
    if (!isAllowedAttachmentUrl(url)) {
      console.error('Attachment URL rejected', { mailId, index, url });
      continue;
    }

    let lastError = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        // Cheap rejection before buffering, when the server declares a size.
        const declared = Number(response.headers.get('content-length'));
        if (Number.isFinite(declared) && declared > MAX_ATTACHMENT_BYTES) {
          throw new Error(`declared size ${declared} exceeds ${MAX_ATTACHMENT_BYTES} bytes`);
        }

        const data = Buffer.from(await response.arrayBuffer());
        if (data.length > MAX_ATTACHMENT_BYTES) {
          throw new Error(`size ${data.length} exceeds ${MAX_ATTACHMENT_BYTES} bytes`);
        }
        if (totalBytes + data.length > MAX_ATTACHMENT_BYTES) {
          throw new Error(`total attachment size would exceed ${MAX_ATTACHMENT_BYTES} bytes`);
        }

        totalBytes += data.length;
        files.push({
          data,
          filename: safeAttachmentFilename(descriptor.filename, `anhang-${index + 1}`),
          contentType: descriptor.contentType || 'application/octet-stream',
        });
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        // One cheap retry absorbs a transient blip without burning the Hasura
        // retry budget, which is measured in hours.
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
      }
    }

    if (lastError) {
      console.error('Attachment fetch failed, sending mail without it', {
        mailId,
        index,
        url,
        error: lastError.message,
      });
    }
  }

  return files;
}

/**
 * Responds to any HTTP request to send emails via Mailgun.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.sendMail = async (req, res) => {
  const expectedSecret = process.env.HASURA_CLOUD_FUNCTION_SECRET;
  if (!expectedSecret) {
    return res.status(500).json({ error: 'Server secret not configured' });
  }

  // Verify the request contains the correct secret header
  if (!secretsMatch(req.headers.secret, expectedSecret)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Extract email parameters from the Hasura event payload
  const { id, subject, content, to, replyTo, cc, bcc, attachments } = req.body.event.data.new;

  // Get mail tag from headers or use default
  const mailTag = req.headers.mailTag || 'eduhub'; // default if not provided

  // Base message configuration
  const msg = {
    from: `noreply@${process.env.MAILGUN_DOMAIN}`,
    to,
    // Prepend '[STAGING]' to subject in staging environment
    subject: process.env.ENVIRONMENT === 'staging' ? '[STAGING] ' + subject : subject,
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
    // Resolved before the environment switch so local development -- which only
    // logs -- still exercises the fetch, the allowlist and the size caps.
    // Otherwise the attachment path would be untestable outside staging.
    const attachmentFiles = await resolveAttachments(attachments, id);
    if (attachmentFiles.length > 0) msg.attachment = attachmentFiles;

    switch (process.env.ENVIRONMENT) {
      case 'development':
        // Development mode: Log all email attempts without actually sending
        console.log('Development email:', {
          to: msg.to,
          from: msg.from,
          subject: msg.subject,
          text: msg.text,
          cc: msg.cc,
          bcc: msg.bcc,
          replyTo: msg['h:Reply-To'],
          attachments: attachmentFiles.map((file) => ({
            filename: file.filename,
            contentType: file.contentType,
            bytes: file.data.length
          }))
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

// Exported for unit tests; not part of the cloud function contract.
exports.resolveAttachments = resolveAttachments;
exports.isAllowedAttachmentUrl = isAllowedAttachmentUrl;
exports.safeAttachmentFilename = safeAttachmentFilename;
