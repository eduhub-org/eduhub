#!/usr/bin/env node

/**
 * Backfill the Stripe invoice of Checkout payments made by direct debit
 * (SEPA Lastschrift) before the webhook learned to link it.
 *
 * Stripe raises a Checkout invoice only once a direct debit is collected,
 * days after checkout.session.completed wrote our Invoice row. Until the fix
 * those rows kept stripeInvoiceId NULL, so the employer never got the PDF.
 *
 * For every Invoice row with a Checkout Session but no stripeInvoiceId this
 * script reads the session, finds the invoice Stripe has raised since, and:
 *
 *   (no flag)   reports what it would do; changes nothing
 *   --apply     links the row: stripeInvoiceId, number, URLs, and PAID when
 *               Stripe says the invoice is paid
 *   --send      --apply, plus queues the JOB_POSTING_INVOICE mail with the
 *               PDF for job postings whose confirmation went out without it
 *
 * --apply is for rows whose employer got the PDF another way (e.g. a manual
 * reply). It is final: a row it links is no longer selected, so a later
 * --send run will not mail it. Use --send directly when the mail is wanted.
 *
 * Course enrollment rows are linked but never mailed: the app sends no
 * course invoice mail.
 *
 * Run from the functions/callNodeFunction/ directory so dependencies resolve:
 *
 *   cd functions/callNodeFunction
 *
 *   HASURA_ENDPOINT=https://hasura.opencampus.sh/v1/graphql \
 *   HASURA_ADMIN_SECRET=<hasura-admin-secret> \
 *   STRIPE_SECRET_KEY=<stripe-secret-key> \
 *   STUJO_FRONTEND_URL=https://stujo.opencampus.sh \
 *   node scripts/backfill-direct-debit-invoices.js [--apply | --send]
 */

import Stripe from 'stripe';
import { GraphQLClient, gql } from 'graphql-request';

import { buildJobPostingMailVars, sendJobPostingMail } from '../publishJobPosting/index.js';

const SEND = process.argv.includes('--send');
const APPLY = SEND || process.argv.includes('--apply');

const GET_UNLINKED = gql`
  query GetUnlinkedCheckoutInvoices {
    Invoice(
      where: {
        stripeCheckoutSessionId: { _is_null: false }
        stripeInvoiceId: { _is_null: true }
        status: { _in: [ISSUED, PAID] }
      }
      order_by: { created_at: asc }
    ) {
      id
      jobPostingId
      courseEnrollmentId
      invoiceNumber
      status
      netTotal
      vatTotal
      grossTotal
      currency
      created_at
      stripeCheckoutSessionId
      JobPosting {
        id
        title
        type
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

const LINK_INVOICE = gql`
  mutation BackfillLinkCheckoutInvoice(
    $id: Int!
    $status: InvoiceStatus_enum!
    $stripeInvoiceId: String!
    $stripeInvoiceNumber: String
    $stripeHostedInvoiceUrl: String
    $stripeInvoicePdfUrl: String
  ) {
    update_Invoice(
      where: { id: { _eq: $id }, stripeInvoiceId: { _is_null: true } }
      _set: {
        status: $status
        stripeInvoiceId: $stripeInvoiceId
        stripeInvoiceNumber: $stripeInvoiceNumber
        stripeHostedInvoiceUrl: $stripeHostedInvoiceUrl
        stripeInvoicePdfUrl: $stripeInvoicePdfUrl
      }
    ) {
      affected_rows
    }
  }
`;

const GET_QUEUED_MAILS = gql`
  query BackfillQueuedJobPostingMails($jobPostingId: Int!) {
    MailLog(where: { metadata: { _contains: { jobPostingId: $jobPostingId } } }) {
      metadata
      attachments
    }
  }
`;

const logger = {
  info: (...args) => console.log(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`${name} is required`);
    process.exit(1);
  }
  return value;
}

/** Why the employer of this posting should (not) get the invoice mail now. */
async function invoiceMailDecision(client, jobPostingId) {
  const { MailLog: mails } = await client.request(GET_QUEUED_MAILS, { jobPostingId });
  const ofType = (type) => mails.filter((mail) => mail.metadata?.type === type);
  if (ofType('JOB_POSTING_INVOICE').length > 0) return 'skip: invoice mail already queued';
  const confirmations = ofType('JOB_POSTING_PUBLISHED');
  if (confirmations.length === 0) return 'skip: no confirmation was ever sent, needs a look';
  if (confirmations.some((mail) => Array.isArray(mail.attachments) && mail.attachments.length > 0)) {
    return 'skip: confirmation already carried a PDF';
  }
  return 'send';
}

async function main() {
  const client = new GraphQLClient(requireEnv('HASURA_ENDPOINT'), {
    headers: { 'x-hasura-admin-secret': requireEnv('HASURA_ADMIN_SECRET') },
  });
  const stripe = new Stripe(requireEnv('STRIPE_SECRET_KEY'));

  console.log(`Mode: ${SEND ? 'send' : APPLY ? 'apply' : 'report only'}`);
  const { Invoice: rows } = await client.request(GET_UNLINKED);
  console.log(`${rows.length} Checkout invoice row(s) without a Stripe invoice\n`);

  const summary = { linked: 0, mailed: 0, pending: 0, failed: 0 };

  for (const row of rows) {
    const owner = row.jobPostingId ? `job posting ${row.jobPostingId}` : `enrollment ${row.courseEnrollmentId}`;
    const label = `Invoice #${row.id} (${owner}, ${row.created_at.slice(0, 10)})`;
    try {
      await backfillRow(client, stripe, row, label, summary);
    } catch (error) {
      console.error(`${label}: failed, ${error.message}`);
      summary.failed += 1;
    }
  }

  console.log('\nSummary:', summary);
  if (summary.failed > 0) process.exitCode = 1;
}

async function backfillRow(client, stripe, row, label, summary) {
  const session = await stripe.checkout.sessions.retrieve(row.stripeCheckoutSessionId);
  if (!session.invoice) {
    console.log(`${label}: no invoice yet, session payment_status ${session.payment_status}`);
    summary.pending += 1;
    return;
  }
  const invoiceDoc =
    typeof session.invoice === 'string' ? await stripe.invoices.retrieve(session.invoice) : session.invoice;
  if (invoiceDoc.status === 'draft') {
    console.log(`${label}: invoice ${invoiceDoc.id} is still a draft`);
    summary.pending += 1;
    return;
  }

  const status = invoiceDoc.status === 'paid' ? 'PAID' : row.status;
  console.log(
    `${label}: ${invoiceDoc.number} (${invoiceDoc.status}), ${row.JobPosting?.ContactUser?.email ?? '-'}` +
      (status !== row.status ? `, ${row.status} -> ${status}` : '')
  );
  if (!APPLY) return;

  const { update_Invoice } = await client.request(LINK_INVOICE, {
    id: row.id,
    status,
    stripeInvoiceId: invoiceDoc.id,
    stripeInvoiceNumber: invoiceDoc.number ?? null,
    stripeHostedInvoiceUrl: invoiceDoc.hosted_invoice_url ?? null,
    stripeInvoicePdfUrl: invoiceDoc.invoice_pdf ?? null,
  });
  if (update_Invoice.affected_rows === 0) {
    console.log('  already linked meanwhile, skipped');
    return;
  }
  summary.linked += 1;

  const posting = row.JobPosting;
  if (!posting?.ContactUser?.email || !invoiceDoc.invoice_pdf) return;

  const decision = await invoiceMailDecision(client, posting.id);
  if (decision !== 'send') {
    console.log(`  ${decision}`);
    return;
  }
  if (!SEND) {
    console.log('  linked without the invoice mail; a later --send will not mail it');
    return;
  }

  const finalizedAt = invoiceDoc.status_transitions?.finalized_at;
  const number = invoiceDoc.number ?? row.invoiceNumber;
  const vars = buildJobPostingMailVars(posting, {
    expiresAt: posting.expiresAt ? new Date(posting.expiresAt) : null,
    publishedAt: posting.publishedAt ? new Date(posting.publishedAt) : null,
    paymentDescription: '',
    invoice: {
      number,
      date: finalizedAt ? new Date(finalizedAt * 1000) : new Date(row.created_at),
      hostedUrl: invoiceDoc.hosted_invoice_url ?? null,
      netTotal: row.netTotal,
      vatTotal: row.vatTotal,
      grossTotal: row.grossTotal,
      currency: row.currency,
      paid: status === 'PAID',
    },
  });
  const queued = await sendJobPostingMail(
    client,
    logger,
    'JOB_POSTING_INVOICE',
    posting.ContactUser.email,
    vars,
    null,
    { InvoiceLink: Boolean(invoiceDoc.hosted_invoice_url), TermsAccepted: Boolean(posting.termsAcceptedAt) },
    posting.id,
    [
      {
        url: invoiceDoc.invoice_pdf,
        filename: `rechnung-${String(number).replace(/[^A-Za-z0-9._-]+/g, '-')}.pdf`,
        contentType: 'application/pdf',
      },
    ]
  );
  if (!queued) {
    console.error(`  JOB_POSTING_INVOICE NOT queued to ${posting.ContactUser.email}, send the PDF by hand`);
    summary.failed += 1;
    return;
  }
  console.log(`  JOB_POSTING_INVOICE queued to ${posting.ContactUser.email}`);
  summary.mailed += 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
