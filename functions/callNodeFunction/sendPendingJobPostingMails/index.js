import Stripe from 'stripe';
import { GraphQLClient, gql } from 'graphql-request';

import {
  buildJobPostingMailVars,
  formatJobPostingAmount,
  sendJobPostingMail,
} from '../publishJobPosting/index.js';

/**
 * Backstop for the StuJo job posting confirmation mail.
 *
 * The mail carries the invoice PDF, so it is only sent once Stripe has
 * finalized the invoice. Normally that happens at checkout.session.completed
 * (fast path) or on invoice.finalized. This sweep exists for when neither
 * fired -- most plausibly because invoice.finalized is not enabled on the
 * webhook endpoint in the Stripe Dashboard, but also for a Stripe backlog or a
 * dropped delivery. Without it an employer could pay and never hear anything.
 *
 * Runs from a Hasura cron trigger (send_pending_job_posting_mails). It is in
 * Node rather than the usual Python cron style because it needs the Stripe SDK,
 * which callPythonFunction does not have, and the mail templating helpers that
 * already live in publishJobPosting.
 */

// Grace period before the sweep takes over, so it never races the two faster
// paths. Combined with the cron interval the worst-case delay is ~30 minutes.
const MIN_AGE_MINUTES = 15;

// Upper bound on how far back to look. Invoices keep their ISSUED/PAID status
// forever, so without a window the oldest handled rows would fill every page
// and a genuinely stuck posting would never be reached -- the sweep would go
// quietly dead. Anything older than this has missed all three chances and needs
// a human, not another retry.
const MAX_AGE_HOURS = 72;
const PAGE_SIZE = 200;

const GET_ALREADY_MAILED = gql`
  query GetJobPostingsAlreadyMailed($since: timestamptz!) {
    MailLog(
      where: {
        created_at: { _gte: $since }
        metadata: { _contains: { type: "JOB_POSTING_PUBLISHED" } }
      }
    ) {
      metadata
    }
  }
`;

const GET_PENDING = gql`
  query GetJobPostingInvoicesAwaitingMail(
    $before: timestamptz!
    $after: timestamptz!
    $excluded: [Int!]
    $limit: Int!
  ) {
    Invoice(
      where: {
        jobPostingId: { _is_null: false, _nin: $excluded }
        created_at: { _lte: $before, _gte: $after }
        status: { _in: [ISSUED, PAID] }
      }
      order_by: { created_at: asc }
      limit: $limit
    ) {
      id
      jobPostingId
      invoiceNumber
      invoiceDate
      netTotal
      vatTotal
      grossTotal
      currency
      status
      created_at
      stripeInvoiceId
      stripeInvoicePdfUrl
      stripeHostedInvoiceUrl
      stripeInvoiceNumber
      JobPosting {
        id
        title
        type
        status
        expiresAt
        publishedAt
        termsAcceptedAt
        ContactUser {
          email
        }
        Organization {
          name
        }
      }
    }
  }
`;

const GET_QUEUED_MAIL = gql`
  query GetQueuedJobPostingMailSweep($contains: jsonb!) {
    MailLog(where: { metadata: { _contains: $contains } }, limit: 1) {
      id
    }
  }
`;

const BACKFILL_INVOICE_DOCUMENT = gql`
  mutation SweepBackfillJobInvoiceDocument(
    $id: Int!
    $stripeInvoiceNumber: String
    $stripeHostedInvoiceUrl: String
    $stripeInvoicePdfUrl: String
  ) {
    update_Invoice_by_pk(
      pk_columns: { id: $id }
      _set: {
        stripeInvoiceNumber: $stripeInvoiceNumber
        stripeHostedInvoiceUrl: $stripeHostedInvoiceUrl
        stripeInvoicePdfUrl: $stripeInvoicePdfUrl
      }
    ) {
      id
    }
  }
`;

export default async function sendPendingJobPostingMails(req, logger) {
  logger.info('########## Send Pending Job Posting Mails ##########');

  const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
    headers: { 'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET },
  });

  const before = new Date(Date.now() - MIN_AGE_MINUTES * 60 * 1000).toISOString();
  const after = new Date(Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000).toISOString();

  // Exclude postings already mailed, in the query rather than in the loop.
  // Filtering afterwards would let handled rows consume every page slot, which
  // is exactly how a backstop stops backstopping.
  const { MailLog: mailed } = await client.request(GET_ALREADY_MAILED, { since: after });
  const excluded = [
    ...new Set(
      mailed
        .map((row) => Number(row.metadata?.jobPostingId))
        .filter((id) => Number.isInteger(id))
    ),
  ];

  const { Invoice: candidates } = await client.request(GET_PENDING, {
    before,
    after,
    excluded,
    limit: PAGE_SIZE,
  });

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
  if (!stripe) {
    logger.warn('STRIPE_SECRET_KEY not configured, sweep cannot resolve missing invoice PDFs');
  }

  let sent = 0;
  let sentWithoutPdf = 0;

  for (const invoice of candidates) {
    const posting = invoice.JobPosting;
    if (!posting?.ContactUser?.email) continue;

    const { MailLog: already } = await client.request(GET_QUEUED_MAIL, {
      contains: { type: 'JOB_POSTING_PUBLISHED', jobPostingId: invoice.jobPostingId },
    });
    if (already.length > 0) continue;

    // One last look: the document may have been finalized since the row was
    // written, we just never heard about it.
    let pdfUrl = invoice.stripeInvoicePdfUrl;
    let hostedUrl = invoice.stripeHostedInvoiceUrl;
    let documentNumber = invoice.stripeInvoiceNumber;
    if (!pdfUrl && stripe && invoice.stripeInvoiceId) {
      try {
        const doc = await stripe.invoices.retrieve(invoice.stripeInvoiceId);
        pdfUrl = doc.invoice_pdf ?? null;
        hostedUrl = doc.hosted_invoice_url ?? null;
        documentNumber = doc.number ?? null;
        if (pdfUrl || hostedUrl || documentNumber) {
          await client.request(BACKFILL_INVOICE_DOCUMENT, {
            id: invoice.id,
            stripeInvoiceNumber: documentNumber,
            stripeHostedInvoiceUrl: hostedUrl,
            stripeInvoicePdfUrl: pdfUrl,
          });
        }
      } catch (error) {
        logger.error('Sweep could not resolve the Stripe invoice', {
          invoiceId: invoice.id,
          stripeInvoiceId: invoice.stripeInvoiceId,
          error: error.message,
        });
      }
    }

    const paid = invoice.status === 'PAID';
    const number = documentNumber || invoice.invoiceNumber;
    const vars = buildJobPostingMailVars(posting, {
      expiresAt: posting.expiresAt ? new Date(posting.expiresAt) : null,
      publishedAt: posting.publishedAt ? new Date(posting.publishedAt) : null,
      paymentDescription: `${formatJobPostingAmount(invoice.grossTotal, invoice.currency)} (${
        paid ? 'bezahlt' : 'Zahlung ausstehend'
      })`,
      invoice: {
        number,
        date: invoice.invoiceDate ? new Date(invoice.invoiceDate) : new Date(invoice.created_at),
        hostedUrl,
        netTotal: invoice.netTotal,
        vatTotal: invoice.vatTotal,
        grossTotal: invoice.grossTotal,
        currency: invoice.currency,
        paid,
      },
    });

    if (!pdfUrl) {
      // Deliberate: an email without the attachment beats no email at all. The
      // employer still gets the invoice figures and, usually, the hosted link.
      logger.error('Sending job posting confirmation without the invoice PDF', {
        jobPostingId: posting.id,
        invoiceId: invoice.id,
        stripeInvoiceId: invoice.stripeInvoiceId,
      });
      sentWithoutPdf += 1;
    }

    await sendJobPostingMail(
      client,
      logger,
      'JOB_POSTING_PUBLISHED',
      posting.ContactUser.email,
      vars,
      null,
      {
        Invoice: true,
        InvoicePdf: Boolean(pdfUrl),
        InvoiceLink: Boolean(hostedUrl),
        InvoicePending: !pdfUrl && !hostedUrl,
        TermsAccepted: Boolean(posting.termsAcceptedAt),
      },
      posting.id,
      pdfUrl
        ? [
            {
              url: pdfUrl,
              filename: `rechnung-${String(number).replace(/[^A-Za-z0-9._-]+/g, '-')}.pdf`,
              contentType: 'application/pdf',
            },
          ]
        : null
    );
    sent += 1;
  }

  // A full page means the window may hold more than one run can handle; the
  // next run picks up the rest, since everything sent here is now excluded.
  if (candidates.length === PAGE_SIZE) {
    logger.warn('Sweep filled a full page, more candidates may remain', { pageSize: PAGE_SIZE });
  }

  logger.info('Pending job posting mail sweep finished', {
    candidates: candidates.length,
    excluded: excluded.length,
    sent,
    sentWithoutPdf,
  });
  return { success: true, candidates: candidates.length, sent, sentWithoutPdf };
}
