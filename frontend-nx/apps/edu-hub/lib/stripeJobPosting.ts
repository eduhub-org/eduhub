import { GraphQLClient, gql } from 'graphql-request';
import type Stripe from 'stripe';

/**
 * StuJo job posting handling for the Stripe webhook (phase 4 of
 * docs/STUJO_INTEGRATION_PLAN.md). Sessions created by the
 * publishJobPosting function carry `jobPostingId` in their metadata;
 * pages/api/webhooks/stripe.ts delegates those events here.
 *
 * Business decisions (2026-07-10):
 * - Instant publish on checkout completion — also for delayed payment
 *   methods (SEPA debit, bank transfer), matching the old Rails
 *   post-first/pay-later flow. The invoice starts as ISSUED and is
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
      organizationId
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

const GET_MAIL_TEMPLATE = gql`
  query GetJobMailTemplateWebhook($type: String!) {
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
  ) {
    insert_MailLog_one(
      object: { subject: $subject, content: $content, from: $from, to: $to, bcc: $bcc, status: $status }
    ) {
      id
    }
  }
`;

const DEFAULT_DURATION_DAYS = 56;

type PostingForWebhook = {
  JobPosting_by_pk: {
    id: number;
    title: string;
    type: string;
    status: string;
    organizationId: number;
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

function replaceVars(text: string, vars: Record<string, string>): string {
  let result = text || '';
  for (const [key, value] of Object.entries(vars)) {
    result = result.split(key).join(value ?? '');
  }
  return result;
}

async function queueMail(
  client: GraphQLClient,
  templateType: string,
  to: string,
  vars: Record<string, string>
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
      subject: replaceVars(template.subject, vars),
      content: replaceVars(template.content, vars),
      from: template.from || 'noreply@stujo.net',
      to,
      bcc: template.bcc || null,
      status: 'READY_TO_SEND',
    });
  } catch (error) {
    // Mails must never fail the webhook.
    console.error(`Failed to queue ${templateType} mail:`, error);
  }
}

function buildMailVars(
  posting: NonNullable<PostingForWebhook['JobPosting_by_pk']>,
  expiresAt: Date | null,
  paymentDescription: string
): Record<string, string> {
  const frontendUrl = process.env.STUJO_FRONTEND_URL || process.env.FRONTEND_URL || '';
  return {
    '[JobPosting:Title]': posting.title,
    '[JobPosting:Type]': posting.type,
    '[JobPosting:ExpiresAt]': expiresAt
      ? expiresAt.toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })
      : '',
    '[JobPosting:DashboardUrl]': `${frontendUrl}/mein-stujo`,
    '[JobPosting:RepostUrl]': `${frontendUrl}/mein-stujo?repost=${posting.id}`,
    '[JobPosting:AdminUrl]': `${frontendUrl}/manage/jobboerse?posting=${posting.id}`,
    '[Organization:Name]': posting.Organization?.name || '',
    '[JobPosting:Payment]': paymentDescription,
  };
}

/**
 * checkout.session.completed for a job posting: publish + invoice + mails.
 */
export async function handleJobPostingCheckoutCompleted(
  client: GraphQLClient,
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
  if (existing.length === 0) {
    const buyerUserId = session.metadata?.userId;
    if (!buyerUserId) {
      throw new Error(`Session ${session.id} is missing userId metadata for the invoice`);
    }
    // With an exclusive tax rate: amount_subtotal = net, amount_total = gross.
    const grossTotal = session.amount_total ?? 0;
    const netTotal = session.amount_subtotal ?? grossTotal;
    const vatTotal = session.total_details?.amount_tax ?? grossTotal - netTotal;
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
      invoiceNumber: `STUJO-${session.id}`,
      // Card payments are settled at completion; SEPA/bank transfer settle
      // later (async_payment_succeeded flips the invoice to PAID).
      status: session.payment_status === 'paid' ? 'PAID' : 'ISSUED',
      netTotal,
      vatTotal,
      grossTotal,
      currency: (session.currency || 'eur').toUpperCase(),
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
    });
  }

  // Mails: employer confirmation + admin post-hoc moderation notice.
  const paymentDescription = `${((session.amount_total ?? 0) / 100).toFixed(2)} € (${
    session.payment_status === 'paid' ? 'bezahlt' : 'Zahlung ausstehend'
  })`;
  const vars = buildMailVars(posting, expiresAt, paymentDescription);
  if (posting.ContactUser?.email) {
    await queueMail(client, 'JOB_POSTING_PUBLISHED', posting.ContactUser.email, vars);
  }
  if (process.env.STUJO_ADMIN_EMAIL) {
    await queueMail(client, 'JOB_POSTING_ADMIN_NOTICE', process.env.STUJO_ADMIN_EMAIL, vars);
  }

  console.log('Job posting published via Stripe webhook', {
    jobPostingId: posting.id,
    sessionId: session.id,
    paymentStatus: session.payment_status,
  });
}

/**
 * Delayed payment (SEPA/bank transfer) settled: invoice ISSUED -> PAID.
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
      buildMailVars(posting, null, 'fehlgeschlagen')
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
