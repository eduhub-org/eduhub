import { GraphQLClient, gql } from 'graphql-request';
import type Stripe from 'stripe';

import { generateInvoiceNumber, resolveStripeInvoice } from './stripeInvoice';

/**
 * StuJo job posting handling for the Stripe webhook (phase 4 of
 * docs/STUJO_INTEGRATION_PLAN.md). Sessions created by the
 * publishJobPosting function carry `jobPostingId` in their metadata;
 * pages/api/webhooks/stripe.ts delegates those events here.
 *
 * Business decisions (2026-07-10):
 * - Instant publish on checkout completion — also for delayed payment
 *   methods (SEPA debit), matching the old Rails post-first/pay-later
 *   flow. The invoice starts as ISSUED and is
 *   flipped to PAID on async_payment_succeeded.
 * - On async_payment_failed the posting is taken offline again (DRAFT),
 *   the invoice is CANCELLED and the employer is notified.
 */

const GET_POSTING_FOR_WEBHOOK = gql`
  query GetJobPostingForWebhook($id: Int!) {
    JobPosting_by_pk(id: $id) {
      id
      title
      type
      status
      expiresAt
      organizationId
      termsAcceptedAt
      ContactUser {
        email
      }
      Organization {
        name
      }
    }
    JobPostingPrice {
      jobPostingType
      durationDays
    }
  }
`;

const PUBLISH_POSTING = gql`
  mutation WebhookPublishJobPosting($id: Int!, $publishedAt: timestamptz!, $expiresAt: timestamptz!) {
    update_JobPosting_by_pk(
      pk_columns: { id: $id }
      _set: { status: PUBLISHED, publishedAt: $publishedAt, expiresAt: $expiresAt }
    ) {
      id
    }
  }
`;

const SET_POSTING_STATUS_DRAFT = gql`
  mutation WebhookSetJobPostingDraft($id: Int!) {
    update_JobPosting_by_pk(pk_columns: { id: $id }, _set: { status: DRAFT }) {
      id
    }
  }
`;

const GET_INVOICE_BY_SESSION = gql`
  query GetJobInvoiceBySession($sessionId: String!) {
    Invoice(where: { stripeCheckoutSessionId: { _eq: $sessionId } }, limit: 1) {
      id
      status
    }
  }
`;

const INSERT_JOB_INVOICE = gql`
  mutation InsertJobPostingInvoice(
    $organizationId: Int!
    $userId: uuid!
    $jobPostingId: Int!
    $invoiceNumber: String!
    $status: InvoiceStatus_enum!
    $netTotal: Int!
    $vatTotal: Int!
    $grossTotal: Int!
    $currency: String!
    $stripeCheckoutSessionId: String
    $stripePaymentIntentId: String
    $stripeInvoiceId: String
    $stripeInvoiceNumber: String
    $stripeHostedInvoiceUrl: String
    $stripeInvoicePdfUrl: String
  ) {
    insert_Invoice_one(
      object: {
        organizationId: $organizationId
        userId: $userId
        jobPostingId: $jobPostingId
        invoiceNumber: $invoiceNumber
        status: $status
        netTotal: $netTotal
        vatTotal: $vatTotal
        grossTotal: $grossTotal
        currency: $currency
        stripeCheckoutSessionId: $stripeCheckoutSessionId
        stripePaymentIntentId: $stripePaymentIntentId
        stripeInvoiceId: $stripeInvoiceId
        stripeInvoiceNumber: $stripeInvoiceNumber
        stripeHostedInvoiceUrl: $stripeHostedInvoiceUrl
        stripeInvoicePdfUrl: $stripeInvoicePdfUrl
      }
    ) {
      id
    }
  }
`;

const UPDATE_INVOICE_STATUS = gql`
  mutation UpdateJobInvoiceStatus($id: Int!, $status: InvoiceStatus_enum!) {
    update_Invoice_by_pk(pk_columns: { id: $id }, _set: { status: $status }) {
      id
    }
  }
`;

/**
 * Dedup lookup for a mail that can now be queued from three places (checkout,
 * invoice.finalized, and the sweep). Mirrors the containment approach of
 * already_sent_keys in functions/callPythonFunction/pythonFunctions/mail_helpers.py,
 * which the MailLog_metadata_idx GIN index exists to serve.
 */
const GET_QUEUED_JOB_MAIL = gql`
  query GetQueuedJobPostingMail($contains: jsonb!) {
    MailLog(where: { metadata: { _contains: $contains } }, limit: 1) {
      id
    }
  }
`;

const GET_INVOICE_BY_STRIPE_ID = gql`
  query GetJobInvoiceByStripeId($stripeInvoiceId: String!) {
    Invoice(where: { stripeInvoiceId: { _eq: $stripeInvoiceId } }, limit: 1) {
      id
      jobPostingId
      invoiceNumber
      netTotal
      vatTotal
      grossTotal
      currency
      status
    }
  }
`;

const BACKFILL_INVOICE_DOCUMENT = gql`
  mutation BackfillJobInvoiceDocument(
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

const GET_MAIL_TEMPLATE = gql`
  query GetJobMailTemplateWebhook($type: MailTemplateType_enum!) {
    MailTemplate(where: { type: { _eq: $type }, courseId: { _is_null: true } }, limit: 1) {
      subject
      content
      from
      bcc
    }
  }
`;

const INSERT_MAIL_LOG = gql`
  mutation InsertJobMailLogWebhook(
    $subject: String!
    $content: String!
    $from: String!
    $to: String!
    $bcc: String
    $status: String!
    $attachments: jsonb
    $metadata: jsonb
  ) {
    insert_MailLog_one(
      object: {
        subject: $subject
        content: $content
        from: $from
        to: $to
        bcc: $bcc
        status: $status
        attachments: $attachments
        metadata: $metadata
      }
    ) {
      id
    }
  }
`;

const DEFAULT_DURATION_DAYS = 56;

/**
 * Display labels for JobPostingType. The enum table deliberately keeps labels
 * in the frontend i18n files, which the mail pipeline cannot reach, so the
 * two queuers carry their own copy. Keep in sync with the identical map in
 * functions/callNodeFunction/publishJobPosting/index.js.
 */
const JOB_POSTING_TYPE_LABELS: Record<string, string> = {
  MINIJOB: 'Minijob',
  WORKING_STUDENT: 'Studentenjob',
  INTERNSHIP: 'Praktikum',
  STATE_RECOGNITION_INTERNSHIP: 'Anerkennungspraktikum',
  THESIS: 'Abschlussarbeit',
  TRAINEE: 'Trainee-Stelle',
  PERMANENT: 'Festanstellung',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Drops [#if:Flag] ... [/if:Flag] sections whose flag is falsy and unwraps the
 * rest, so one template can serve paid, free and credit-funded postings.
 *
 * Loops because String.replace does not rescan replaced regions, and the
 * invoice block nests an inner [#if:InvoiceLink].
 */
export function applyConditionalBlocks(text: string, flags: Record<string, boolean>): string {
  const pattern = /\[#if:([A-Za-z]+)\]([\s\S]*?)\[\/if:\1\]/g;
  let result = text || '';
  for (let pass = 0; pass < 5; pass += 1) {
    const next = result.replace(pattern, (_match, key: string, body: string) =>
      flags[key] ? body : ''
    );
    if (next === result) return next;
    result = next;
  }
  return result;
}

function formatAmount(cents: number, currency: string): string {
  const symbol = currency.toUpperCase() === 'EUR' ? '\u20ac' : currency.toUpperCase();
  return `${(cents / 100).toFixed(2).replace('.', ',')} ${symbol}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** Invoice figures the confirmation mail renders; null on free/credit postings. */
type InvoiceMailData = {
  number: string;
  hostedUrl: string | null;
  netTotal: number;
  vatTotal: number;
  grossTotal: number;
  currency: string;
  paid: boolean;
};

type PostingForWebhook = {
  JobPosting_by_pk: {
    id: number;
    title: string;
    type: string;
    status: string;
    expiresAt: string | null;
    organizationId: number;
    termsAcceptedAt: string | null;
    ContactUser: { email: string } | null;
    Organization: { name: string } | null;
  } | null;
  JobPostingPrice: Array<{ jobPostingType: string; durationDays: number }>;
};

export function parseJobPostingId(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

/**
 * Substitutes [Entity:Field] placeholders. Values are HTML-escaped by default
 * because they are employer-controlled and the result is sent as HTML -- the
 * admin notice carries the same values into a staff inbox. Subjects are plain
 * text, so they pass { html: false }.
 */
function replaceVars(
  text: string,
  vars: Record<string, string>,
  options: { html?: boolean } = {}
): string {
  const { html = true } = options;
  let result = text || '';
  for (const [key, value] of Object.entries(vars)) {
    const replacement = value ?? '';
    result = result.split(key).join(html ? escapeHtml(replacement) : replacement);
  }
  return result;
}

/**
 * True when this mail has already been queued for this posting. Deliberately
 * not gated on Invoice existence: the mail may legitimately be sent on a later
 * delivery than the one that created the invoice row.
 */
export async function hasQueuedJobPostingMail(
  client: GraphQLClient,
  templateType: string,
  jobPostingId: number
): Promise<boolean> {
  const { MailLog } = await client.request<{ MailLog: Array<{ id: number }> }>(
    GET_QUEUED_JOB_MAIL,
    { contains: { type: templateType, jobPostingId } }
  );
  return MailLog.length > 0;
}

async function queueMail(
  client: GraphQLClient,
  templateType: string,
  to: string,
  vars: Record<string, string>,
  flags: Record<string, boolean> = {},
  attachments: Array<{ url: string; filename: string; contentType: string }> | null = null,
  jobPostingId: number | null = null
) {
  try {
    const templateData = await client.request<{
      MailTemplate: Array<{ subject: string; content: string; from: string | null; bcc: string | null }>;
    }>(GET_MAIL_TEMPLATE, { type: templateType });
    const template = templateData?.MailTemplate?.[0];
    if (!template) {
      console.warn(`Mail template ${templateType} not found, skipping`);
      return;
    }
    await client.request(INSERT_MAIL_LOG, {
      subject: replaceVars(applyConditionalBlocks(template.subject, flags), vars, { html: false }),
      content: replaceVars(applyConditionalBlocks(template.content, flags), vars),
      from: template.from || 'noreply@stujo.net',
      to,
      bcc: template.bcc || null,
      status: 'READY_TO_SEND',
      attachments,
      metadata: jobPostingId === null ? null : { type: templateType, jobPostingId },
    });
  } catch (error) {
    // Mails must never fail the webhook.
    console.error(`Failed to queue ${templateType} mail:`, error);
  }
}

/**
 * Every key here must also be produced by publishAndNotify in
 * functions/callNodeFunction/publishJobPosting/index.js -- the replacer only
 * substitutes keys it is handed, so a key missing on the free/credit path
 * would reach the employer as literal "[Invoice:Number]" text.
 */
function buildMailVars(
  posting: NonNullable<PostingForWebhook['JobPosting_by_pk']>,
  expiresAt: Date | null,
  paymentDescription: string,
  invoice: InvoiceMailData | null = null
): Record<string, string> {
  const frontendUrl = process.env.STUJO_FRONTEND_URL || process.env.FRONTEND_URL || '';
  const vatRate =
    invoice && invoice.netTotal > 0 ? String(Math.round((invoice.vatTotal / invoice.netTotal) * 100)) : '';
  return {
    '[JobPosting:Title]': posting.title,
    '[JobPosting:Type]': JOB_POSTING_TYPE_LABELS[posting.type] || posting.type,
    '[JobPosting:ExpiresAt]': expiresAt ? formatDate(expiresAt) : '',
    '[JobPosting:PublishedAt]': formatDate(new Date()),
    '[JobPosting:TermsAcceptedAt]': posting.termsAcceptedAt
      ? formatDate(new Date(posting.termsAcceptedAt))
      : '',
    '[JobPosting:DashboardUrl]': `${frontendUrl}/mein-stujo`,
    '[JobPosting:RepostUrl]': `${frontendUrl}/mein-stujo?repost=${posting.id}`,
    '[JobPosting:AdminUrl]': `${frontendUrl}/manage/jobboerse?posting=${posting.id}`,
    '[Organization:Name]': posting.Organization?.name || '',
    '[JobPosting:Payment]': paymentDescription,
    '[Invoice:Number]': invoice?.number || '',
    '[Invoice:Date]': invoice ? formatDate(new Date()) : '',
    '[Invoice:NetTotal]': invoice ? formatAmount(invoice.netTotal, invoice.currency) : '',
    '[Invoice:VatRate]': vatRate,
    '[Invoice:VatTotal]': invoice ? formatAmount(invoice.vatTotal, invoice.currency) : '',
    '[Invoice:GrossTotal]': invoice ? formatAmount(invoice.grossTotal, invoice.currency) : '',
    '[Invoice:HostedUrl]': invoice?.hostedUrl || '',
    '[Invoice:PaymentStatus]': invoice ? (invoice.paid ? 'bezahlt' : 'Zahlung ausstehend') : '',
    '[Legal:TermsUrl]': process.env.STUJO_TERMS_URL || 'https://www.stujo.net/agb',
  };
}

/**
 * Queues the single combined confirmation mail, PDF attached.
 *
 * Called from three places -- checkout.session.completed when Stripe has
 * already finalized the invoice, the invoice.finalized handler when it had not,
 * and the sendPendingJobPostingMails sweep when neither fired. Returns false if
 * the mail was already queued, so callers can stay quiet about it.
 */
export async function queueJobPostingConfirmation(
  client: GraphQLClient,
  posting: NonNullable<PostingForWebhook['JobPosting_by_pk']>,
  expiresAt: Date | null,
  invoice: InvoiceMailData,
  pdfUrl: string | null
): Promise<boolean> {
  if (!posting.ContactUser?.email) return false;
  if (await hasQueuedJobPostingMail(client, 'JOB_POSTING_PUBLISHED', posting.id)) return false;

  const paymentDescription = `${formatAmount(invoice.grossTotal, invoice.currency)} (${
    invoice.paid ? 'bezahlt' : 'Zahlung ausstehend'
  })`;
  const vars = buildMailVars(posting, expiresAt, paymentDescription, invoice);
  // InvoicePdf and InvoiceLink are separate from Invoice on purpose: the
  // section must not claim a PDF is attached when the sweep had to send without
  // one. InvoicePending covers the case where neither exists yet.
  const flags = {
    Invoice: true,
    InvoicePdf: Boolean(pdfUrl),
    InvoiceLink: Boolean(invoice.hostedUrl),
    InvoicePending: !pdfUrl && !invoice.hostedUrl,
    TermsAccepted: Boolean(posting.termsAcceptedAt),
  };
  const attachments = pdfUrl
    ? [
        {
          url: pdfUrl,
          filename: `rechnung-${invoice.number.replace(/[^A-Za-z0-9._-]+/g, '-')}.pdf`,
          contentType: 'application/pdf',
        },
      ]
    : null;

  await queueMail(
    client,
    'JOB_POSTING_PUBLISHED',
    posting.ContactUser.email,
    vars,
    flags,
    attachments,
    posting.id
  );
  return true;
}

/**
 * checkout.session.completed for a job posting: publish + invoice + mails.
 */
export async function handleJobPostingCheckoutCompleted(
  client: GraphQLClient,
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  jobPostingId: number
): Promise<void> {
  const data = await client.request<PostingForWebhook>(GET_POSTING_FOR_WEBHOOK, { id: jobPostingId });
  const posting = data.JobPosting_by_pk;
  if (!posting) {
    throw new Error(`Job posting ${jobPostingId} not found`);
  }

  // Publish (idempotent: re-delivered events see PUBLISHED and skip).
  let expiresAt: Date | null = null;
  if (posting.status !== 'PUBLISHED') {
    const durationDays =
      data.JobPostingPrice.find((p) => p.jobPostingType === posting.type)?.durationDays ??
      DEFAULT_DURATION_DAYS;
    const publishedAt = new Date();
    expiresAt = new Date(publishedAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
    await client.request(PUBLISH_POSTING, {
      id: posting.id,
      publishedAt: publishedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
  }

  // Invoice (idempotent via stripeCheckoutSessionId).
  const { Invoice: existing } = await client.request<{ Invoice: Array<{ id: number }> }>(
    GET_INVOICE_BY_SESSION,
    { sessionId: session.id }
  );
  const invoiceCreated = existing.length === 0;

  // With an exclusive tax rate: amount_subtotal = net, amount_total = gross.
  const grossTotal = session.amount_total ?? 0;
  const netTotal = session.amount_subtotal ?? grossTotal;
  const vatTotal = session.total_details?.amount_tax ?? grossTotal - netTotal;
  const currency = (session.currency || 'eur').toUpperCase();
  const paid = session.payment_status === 'paid';
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  // Resolved before the insert branch because the confirmation mail below needs
  // the same document, and re-reading it there would cost a second round trip.
  // Read once, no waiting: Stripe finalizes invoice_creation invoices
  // asynchronously, so the PDF may not exist yet. When it does not, the mail is
  // left to the invoice.finalized handler rather than blocking the webhook.
  const invoiceDoc = await resolveStripeInvoice(stripe, session.invoice);

  // Our own record key, mirroring the course path. Deliberately not Stripe's
  // number: that one is what is printed on the document the employer receives
  // and is stored separately in stripeInvoiceNumber.
  const invoiceNumber = generateInvoiceNumber('STUJO', session.id, paymentIntentId);

  if (invoiceCreated) {
    const buyerUserId = session.metadata?.userId;
    if (!buyerUserId) {
      throw new Error(`Session ${session.id} is missing userId metadata for the invoice`);
    }
    // The platform (not the employer) is the selling organization.
    const sellerOrganizationId = Number.parseInt(
      process.env.STUJO_SELLER_ORGANIZATION_ID || '',
      10
    );
    await client.request(INSERT_JOB_INVOICE, {
      organizationId: Number.isInteger(sellerOrganizationId)
        ? sellerOrganizationId
        : posting.organizationId,
      userId: buyerUserId,
      jobPostingId: posting.id,
      invoiceNumber,
      // Card payments are settled at completion; SEPA settles later
      // (async_payment_succeeded flips the invoice to PAID).
      status: paid ? 'PAID' : 'ISSUED',
      netTotal,
      vatTotal,
      grossTotal,
      currency,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      stripeInvoiceId: invoiceDoc.id,
      stripeInvoiceNumber: invoiceDoc.number,
      stripeHostedInvoiceUrl: invoiceDoc.hostedUrl,
      stripeInvoicePdfUrl: invoiceDoc.pdfUrl,
    });
  }

  const mailExpiresAt = expiresAt ?? (posting.expiresAt ? new Date(posting.expiresAt) : null);
  const invoice: InvoiceMailData = {
    // The document number is what the employer sees on the attached PDF; fall
    // back to our own key while Stripe has not finalized the invoice yet.
    number: invoiceDoc.number ?? invoiceNumber,
    hostedUrl: invoiceDoc.hostedUrl,
    netTotal,
    vatTotal,
    grossTotal,
    currency,
    paid,
  };

  // The employer's copy carries the PDF, so it only goes out once the document
  // exists. When Stripe has not finalized yet, invoice.finalized sends it (and
  // the sendPendingJobPostingMails sweep is the backstop for that). Dedup is on
  // MailLog.metadata rather than the invoiceCreated branch, because the mail
  // can legitimately be queued by a later delivery than the one that inserted
  // the invoice row.
  if (posting.ContactUser?.email) {
    if (invoiceDoc.pdfUrl) {
      await queueJobPostingConfirmation(client, posting, mailExpiresAt, invoice, invoiceDoc.pdfUrl);
    } else {
      console.info('Stripe invoice not finalized yet, deferring the confirmation mail', {
        jobPostingId: posting.id,
        sessionId: session.id,
        invoiceStatus: invoiceDoc.status,
      });
    }
  }

  // The admin notice carries no invoice figures, so it never has to wait.
  if (
    process.env.STUJO_ADMIN_EMAIL &&
    !(await hasQueuedJobPostingMail(client, 'JOB_POSTING_ADMIN_NOTICE', posting.id))
  ) {
    await queueMail(
      client,
      'JOB_POSTING_ADMIN_NOTICE',
      process.env.STUJO_ADMIN_EMAIL,
      buildMailVars(
        posting,
        mailExpiresAt,
        `${formatAmount(grossTotal, currency)} (${paid ? 'bezahlt' : 'Zahlung ausstehend'})`,
        invoice
      ),
      {
        Invoice: true,
        InvoicePdf: false,
        InvoiceLink: Boolean(invoiceDoc.hostedUrl),
        InvoicePending: !invoiceDoc.hostedUrl,
        TermsAccepted: Boolean(posting.termsAcceptedAt),
      },
      null,
      posting.id
    );
  }

  console.log('Job posting published via Stripe webhook', {
    jobPostingId: posting.id,
    sessionId: session.id,
    paymentStatus: session.payment_status,
  });
}

/**
 * Delayed payment (SEPA) settled: invoice ISSUED -> PAID.
 */
export async function handleJobPostingAsyncPaymentSucceeded(
  client: GraphQLClient,
  session: Stripe.Checkout.Session
): Promise<void> {
  const { Invoice: invoices } = await client.request<{ Invoice: Array<{ id: number; status: string }> }>(
    GET_INVOICE_BY_SESSION,
    { sessionId: session.id }
  );
  if (invoices.length > 0 && invoices[0].status !== 'PAID') {
    await client.request(UPDATE_INVOICE_STATUS, { id: invoices[0].id, status: 'PAID' });
  }
}

/**
 * Delayed payment failed: posting offline, invoice cancelled, employer mail.
 */
export async function handleJobPostingAsyncPaymentFailed(
  client: GraphQLClient,
  session: Stripe.Checkout.Session,
  jobPostingId: number
): Promise<void> {
  const data = await client.request<PostingForWebhook>(GET_POSTING_FOR_WEBHOOK, { id: jobPostingId });
  const posting = data.JobPosting_by_pk;
  if (posting && posting.status === 'PUBLISHED') {
    await client.request(SET_POSTING_STATUS_DRAFT, { id: posting.id });
  }

  const { Invoice: invoices } = await client.request<{ Invoice: Array<{ id: number; status: string }> }>(
    GET_INVOICE_BY_SESSION,
    { sessionId: session.id }
  );
  if (invoices.length > 0 && invoices[0].status !== 'CANCELLED') {
    await client.request(UPDATE_INVOICE_STATUS, { id: invoices[0].id, status: 'CANCELLED' });
  }

  if (posting?.ContactUser?.email) {
    await queueMail(
      client,
      'JOB_POSTING_PAYMENT_FAILED',
      posting.ContactUser.email,
      buildMailVars(posting, null, 'fehlgeschlagen'),
      {
        Invoice: false,
        InvoicePdf: false,
        InvoiceLink: false,
        InvoicePending: false,
        TermsAccepted: Boolean(posting.termsAcceptedAt),
      }
    );
  }
  console.warn('Job posting payment failed, posting taken offline', {
    jobPostingId,
    sessionId: session.id,
  });
}

/**
 * Checkout abandoned: PENDING_PAYMENT -> DRAFT so the employer can retry.
 */
export async function handleJobPostingCheckoutExpired(
  client: GraphQLClient,
  jobPostingId: number
): Promise<void> {
  const data = await client.request<PostingForWebhook>(GET_POSTING_FOR_WEBHOOK, { id: jobPostingId });
  if (data.JobPosting_by_pk?.status === 'PENDING_PAYMENT') {
    await client.request(SET_POSTING_STATUS_DRAFT, { id: jobPostingId });
  }
}

/**
 * invoice.finalized: the document now has a number and a PDF.
 *
 * Stripe finalizes invoice_creation invoices asynchronously, so this is the
 * supported signal that the attachment exists -- rather than polling inside
 * checkout.session.completed, which cannot outrun a finalization that Stripe
 * may delay by an hour, or by up to 72 hours while deliveries are failing.
 *
 * Backfills the document columns and, if the confirmation has not gone out yet,
 * sends it now. Safe to receive more than once: the send is deduped on
 * MailLog.metadata and the backfill is an idempotent _set.
 */
export async function handleJobPostingInvoiceFinalized(
  client: GraphQLClient,
  invoiceDoc: Stripe.Invoice
): Promise<void> {
  if (!invoiceDoc.id) return;

  const { Invoice: rows } = await client.request<{
    Invoice: Array<{
      id: number;
      jobPostingId: number | null;
      invoiceNumber: string;
      netTotal: number;
      vatTotal: number;
      grossTotal: number;
      currency: string;
      status: string;
    }>;
  }>(GET_INVOICE_BY_STRIPE_ID, { stripeInvoiceId: invoiceDoc.id });

  const row = rows[0];
  // Not ours, or a course invoice: nothing to do beyond the backfill below.
  if (!row) return;

  await client.request(BACKFILL_INVOICE_DOCUMENT, {
    id: row.id,
    stripeInvoiceNumber: invoiceDoc.number ?? null,
    stripeHostedInvoiceUrl: invoiceDoc.hosted_invoice_url ?? null,
    stripeInvoicePdfUrl: invoiceDoc.invoice_pdf ?? null,
  });

  if (!row.jobPostingId) return;

  const data = await client.request<PostingForWebhook>(GET_POSTING_FOR_WEBHOOK, {
    id: row.jobPostingId,
  });
  const posting = data.JobPosting_by_pk;
  if (!posting) return;

  const sent = await queueJobPostingConfirmation(
    client,
    posting,
    posting.expiresAt ? new Date(posting.expiresAt) : null,
    {
      number: invoiceDoc.number ?? row.invoiceNumber,
      hostedUrl: invoiceDoc.hosted_invoice_url ?? null,
      netTotal: row.netTotal,
      vatTotal: row.vatTotal,
      grossTotal: row.grossTotal,
      currency: row.currency,
      paid: row.status === 'PAID',
    },
    invoiceDoc.invoice_pdf ?? null
  );

  console.log('Job posting invoice finalized', {
    jobPostingId: row.jobPostingId,
    stripeInvoiceId: invoiceDoc.id,
    stripeInvoiceNumber: invoiceDoc.number,
    confirmationQueuedNow: sent,
  });
}
