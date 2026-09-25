import Stripe from 'stripe';
import { GraphQLClient, gql } from 'graphql-request';

import {
  buildInvoiceCreation,
  buildJobPostingPaymentDescription,
  buildPaymentMethodConfig,
  getOrCreateCustomer,
  getOrCreateTaxRate,
} from '../lib/stripeTax.js';
import {
  POSTING_NOT_PUBLISHABLE,
  applyCustomerBilling,
  buildInvoicePaymentDescription,
  fillOrganizationBilling,
  hasQueuedPublishedMail,
  issueBankTransferInvoice,
  loadInvoiceOrganization,
  normalizeBillingInput,
} from './invoicePayment.js';

/**
 * Single entry point for publishing a StuJo job posting (phase 4 of
 * docs/STUJO_INTEGRATION_PLAN.md).
 *
 * Flow (agreed 2026-07-10):
 * - Free type (price 0, e.g. MINIJOB)  -> publish immediately
 * - Unlimited JobPostingCredit          -> publish, nothing consumed
 * - Available JobPostingCredit          -> consume one credit, publish
 * - Otherwise                           -> status PENDING_PAYMENT + Stripe
 *   Checkout Session (card, SEPA debit; net price + fixed 19% VAT).
 *   The webhook publishes on checkout.session.completed.
 * - paymentMethod INVOICE (organizations with allowInvoicePayment only)
 *                                       -> Stripe invoice paid by bank
 *   transfer, published immediately; see invoicePayment.js.
 *
 * Caller must be an OrganizationAdmin with canManageJobs for the posting's
 * organization. Direct status changes are blocked by Hasura permissions,
 * so this action is the only publish path.
 */

const GET_POSTING = gql`
  query GetJobPostingForPublish($id: Int!) {
    JobPosting_by_pk(id: $id) {
      id
      title
      type
      status
      expiresAt
      organizationId
      contactUserId
      termsAcceptedAt
      ContactUser {
        email
      }
      Organization {
        name
        OrganizationAdmins {
          userId
          canManageJobs
        }
      }
    }
    JobPostingPrice {
      jobPostingType
      price
      currency
      vatRate
      durationDays
      stripePriceId
    }
  }
`;

const GET_CREDIT = gql`
  query GetJobPostingCredit($organizationId: Int!, $type: JobPostingType_enum!) {
    JobPostingCredit(
      where: {
        organizationId: { _eq: $organizationId }
        _and: [
          { _or: [{ remaining: { _gt: 0 } }, { unlimited: { _eq: true } }] }
          { _or: [{ jobPostingType: { _eq: $type } }, { jobPostingType: { _is_null: true } }] }
        ]
      }
      order_by: [{ unlimited: desc }, { jobPostingType: desc_nulls_last }]
      limit: 1
    ) {
      id
      remaining
      unlimited
    }
  }
`;

const CONSUME_CREDIT = gql`
  mutation ConsumeJobPostingCredit($id: Int!, $currentRemaining: Int!) {
    update_JobPostingCredit(
      where: { id: { _eq: $id }, remaining: { _eq: $currentRemaining } }
      _inc: { remaining: -1 }
    ) {
      affected_rows
    }
  }
`;

const PUBLISH_POSTING = gql`
  mutation PublishJobPosting($id: Int!, $publishedAt: timestamptz!, $expiresAt: timestamptz!) {
    update_JobPosting_by_pk(
      pk_columns: { id: $id }
      _set: { status: PUBLISHED, publishedAt: $publishedAt, expiresAt: $expiresAt }
    ) {
      id
      status
    }
  }
`;

// The invoice path bills before anyone pays, so the publish must be the
// guard against a second concurrent request (two tabs, a double submit):
// only one of them can move the posting out of a publishable status.
const PUBLISH_POSTING_IF_PUBLISHABLE = gql`
  mutation PublishJobPostingIfPublishable(
    $id: Int!
    $publishedAt: timestamptz!
    $expiresAt: timestamptz!
  ) {
    update_JobPosting(
      where: { id: { _eq: $id }, status: { _in: [DRAFT, EXPIRED, PENDING_PAYMENT, DEACTIVATED] } }
      _set: { status: PUBLISHED, publishedAt: $publishedAt, expiresAt: $expiresAt }
    ) {
      affected_rows
    }
  }
`;

const SET_PENDING_PAYMENT = gql`
  mutation SetJobPostingPendingPayment($id: Int!) {
    update_JobPosting_by_pk(pk_columns: { id: $id }, _set: { status: PENDING_PAYMENT }) {
      id
      status
    }
  }
`;

const SET_TERMS_ACCEPTED = gql`
  mutation SetJobPostingTermsAccepted($id: Int!, $at: timestamptz!) {
    update_JobPosting_by_pk(pk_columns: { id: $id }, _set: { termsAcceptedAt: $at }) {
      id
    }
  }
`;

const GET_MAIL_TEMPLATE = gql`
  query GetJobMailTemplate($type: MailTemplateType_enum!) {
    MailTemplate(where: { type: { _eq: $type }, courseId: { _is_null: true } }, limit: 1) {
      subject
      content
      from
      cc
      bcc
    }
  }
`;

const INSERT_MAIL_LOG = gql`
  mutation InsertJobMailLog(
    $subject: String!
    $content: String!
    $from: String!
    $to: String!
    $bcc: String
    $status: String!
    $metadata: jsonb
    $attachments: jsonb
  ) {
    insert_MailLog_one(
      object: {
        subject: $subject
        content: $content
        from: $from
        to: $to
        bcc: $bcc
        status: $status
        metadata: $metadata
        attachments: $attachments
      }
    ) {
      id
    }
  }
`;

// The publication window falls back to the StuJo default (8 weeks) if the
// price row is missing a duration.
const DEFAULT_DURATION_DAYS = 56;

/**
 * Display labels for JobPostingType. The enum table deliberately keeps labels
 * in the frontend i18n files, which the mail pipeline cannot reach. Keep in
 * sync with the identical map in
 * frontend-nx/apps/edu-hub/lib/stripeJobPosting.ts.
 */
const JOB_POSTING_TYPE_LABELS = {
  MINIJOB: 'Minijob',
  WORKING_STUDENT: 'Studentenjob',
  INTERNSHIP: 'Praktikum',
  STATE_RECOGNITION_INTERNSHIP: 'Anerkennungspraktikum',
  THESIS: 'Abschlussarbeit',
  TRAINEE: 'Trainee-Stelle',
  PERMANENT: 'Festanstellung',
};

export function escapeHtml(value) {
  return String(value)
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
export function applyConditionalBlocks(text, flags = {}) {
  const pattern = /\[#if:([A-Za-z]+)\]([\s\S]*?)\[\/if:\1\]/g;
  let result = text || '';
  for (let pass = 0; pass < 5; pass += 1) {
    const next = result.replace(pattern, (_match, key, body) => (flags[key] ? body : ''));
    if (next === result) return next;
    result = next;
  }
  return result;
}

/**
 * Substitutes [Entity:Field] placeholders. Values are HTML-escaped by default
 * because they are employer-controlled and the result is sent as HTML -- the
 * admin notice carries the same values into a staff inbox. Subjects are plain
 * text, so they pass { html: false }.
 */
export function replaceJobPostingVariables(text, vars, options = {}) {
  const { html = true } = options;
  let result = text || '';
  for (const [key, value] of Object.entries(vars)) {
    const replacement = value ?? '';
    result = result.split(key).join(html ? escapeHtml(replacement) : replacement);
  }
  return result;
}

export async function sendJobPostingMail(
  client,
  logger,
  templateType,
  to,
  vars,
  bcc = null,
  flags = {},
  jobPostingId = null,
  attachments = null
) {
  try {
    const templateData = await client.request(GET_MAIL_TEMPLATE, { type: templateType });
    const template = templateData?.MailTemplate?.[0];
    if (!template) {
      logger.warn(`Mail template ${templateType} not found, skipping mail`);
      return;
    }
    await client.request(INSERT_MAIL_LOG, {
      subject: replaceJobPostingVariables(applyConditionalBlocks(template.subject, flags), vars, {
        html: false,
      }),
      content: replaceJobPostingVariables(applyConditionalBlocks(template.content, flags), vars),
      from: template.from || 'team@stujo.net',
      to,
      bcc: bcc || template.bcc || null,
      status: 'READY_TO_SEND',
      // Dedup key for the sweep and the invoice.finalized handler, which can
      // both queue this same mail later. See hasQueuedJobPostingMail in
      // frontend-nx/apps/edu-hub/lib/stripeJobPosting.ts.
      metadata: jobPostingId === null ? null : { type: templateType, jobPostingId },
      attachments,
    });
  } catch (error) {
    // Losing the race against the unique dedup index means the mail is already
    // queued -- that is the guard working, not a failure.
    if (String(error?.message ?? error).includes('MailLog_job_posting_mail_unique')) {
      logger.info(`${templateType} already queued for job posting ${jobPostingId}`);
      return;
    }
    // Mails must never break the publish flow.
    logger.error(`Failed to queue ${templateType} mail`, { error: error.message });
  }
}

export const formatJobPostingDate = (date) =>
  date.toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });

export function formatJobPostingAmount(cents, currency) {
  const symbol = String(currency).toUpperCase() === 'EUR' ? '\u20ac' : String(currency).toUpperCase();
  return `${(cents / 100).toFixed(2).replace('.', ',')} ${symbol}`;
}

/**
 * Builds the mail variables for a job posting.
 *
 * The key set must stay identical to buildMailVars in
 * frontend-nx/apps/edu-hub/lib/stripeJobPosting.ts: the replacer only
 * substitutes keys it is handed, so a key missing on one path would reach the
 * employer as literal "[Invoice:Number]" text. There is a parity test for this.
 *
 * `invoice` is null for free and credit-funded postings, which have no Invoice
 * row at all; every [Invoice:*] key is then present but empty and the
 * [#if:Invoice] block is dropped.
 */
export function buildJobPostingMailVars(posting, { expiresAt, publishedAt, paymentDescription, invoice = null }) {
  const frontendUrl = process.env.STUJO_FRONTEND_URL || process.env.FRONTEND_URL || '';
  // The job board admin UI lives in the edu-hub app, not the stujo app.
  const adminAppUrl = process.env.FRONTEND_URL || frontendUrl;
  const vatRate =
    invoice && invoice.netTotal > 0
      ? String(Math.round((invoice.vatTotal / invoice.netTotal) * 100))
      : '';

  return {
    '[JobPosting:Title]': posting.title,
    '[JobPosting:Type]': JOB_POSTING_TYPE_LABELS[posting.type] || posting.type,
    '[JobPosting:ExpiresAt]': expiresAt ? formatJobPostingDate(expiresAt) : '',
    '[JobPosting:PublishedAt]': publishedAt ? formatJobPostingDate(publishedAt) : '',
    '[JobPosting:TermsAcceptedAt]': posting.termsAcceptedAt
      ? formatJobPostingDate(new Date(posting.termsAcceptedAt))
      : '',
    '[JobPosting:DashboardUrl]': `${frontendUrl}/mein-stujo`,
    '[JobPosting:RepostUrl]': `${frontendUrl}/mein-stujo?repost=${posting.id}`,
    '[JobPosting:AdminUrl]': `${adminAppUrl}/manage/settings/jobboerse?posting=${posting.id}`,
    '[Organization:Name]': posting.Organization?.name || '',
    '[JobPosting:Payment]': paymentDescription || '',
    '[Invoice:Number]': invoice?.number || '',
    '[Invoice:Date]': invoice?.date ? formatJobPostingDate(invoice.date) : '',
    '[Invoice:NetTotal]': invoice ? formatJobPostingAmount(invoice.netTotal, invoice.currency) : '',
    '[Invoice:VatRate]': vatRate,
    '[Invoice:VatTotal]': invoice ? formatJobPostingAmount(invoice.vatTotal, invoice.currency) : '',
    '[Invoice:GrossTotal]': invoice ? formatJobPostingAmount(invoice.grossTotal, invoice.currency) : '',
    '[Invoice:HostedUrl]': invoice?.hostedUrl || '',
    '[Invoice:PaymentStatus]': invoice ? (invoice.paid ? 'bezahlt' : 'Zahlung ausstehend') : '',
    // Absolute: this is read in an email, where a relative path is dead.
    '[Legal:TermsUrl]': process.env.STUJO_TERMS_URL || `${frontendUrl}/agb`,
  };
}

async function publishPosting(client, postingId, durationDays) {
  const publishedAt = new Date();
  const expiresAt = new Date(publishedAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
  await client.request(PUBLISH_POSTING, {
    id: postingId,
    publishedAt: publishedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });
  return { publishedAt, expiresAt };
}

export async function publishAndNotify(client, logger, posting, durationDays) {
  const { publishedAt, expiresAt } = await publishPosting(client, posting.id, durationDays);

  const vars = buildJobPostingMailVars(posting, {
    expiresAt,
    publishedAt,
    paymentDescription: posting.paymentDescription || '',
  });
  const flags = {
    Invoice: false,
    InvoicePdf: false,
    InvoiceLink: false,
    InvoicePending: false,
    TermsAccepted: Boolean(posting.termsAcceptedAt),
  };

  if (posting.ContactUser?.email) {
    await sendJobPostingMail(
      client,
      logger,
      'JOB_POSTING_PUBLISHED',
      posting.ContactUser.email,
      vars,
      null,
      flags,
      posting.id
    );
  }
  const adminMail = process.env.STUJO_ADMIN_EMAIL;
  if (adminMail) {
    await sendJobPostingMail(
      client,
      logger,
      'JOB_POSTING_ADMIN_NOTICE',
      adminMail,
      vars,
      null,
      flags,
      posting.id
    );
  }
  return { publishedAt, expiresAt };
}

/**
 * The INVOICE branch of the paid path: bank transfer invoice, immediate
 * publish, and the confirmation mail with the invoice PDF attached.
 */
async function publishByInvoice({
  stripe,
  client,
  logger,
  posting,
  billing,
  invoiceOrganization,
  customerId: existingCustomerId,
  lineItem,
  currency,
  sellerOrganization,
  sellerOrgId,
  sessionUserId,
  durationDays,
}) {
  const customerId =
    existingCustomerId ?? (await stripe.customers.create({ name: billing.legalName })).id;
  const vatError = await applyCustomerBilling(stripe, customerId, billing, logger);
  if (vatError) {
    return { success: false, error: 'The VAT ID was rejected', messageKey: vatError };
  }
  // Only pre-fills the next order; never worth failing the publish for.
  await fillOrganizationBilling(client, invoiceOrganization, billing).catch((error) =>
    logger.warn('Could not save the billing address on the organization', { error: error.message })
  );

  let published = null;
  let issued;
  try {
    issued = await issueBankTransferInvoice({
      stripe,
      client,
      logger,
      customerId,
      lineItem,
      currency,
      footer: buildInvoiceCreation(sellerOrganization).invoice_data?.footer ?? null,
      description: buildJobPostingPaymentDescription(
        posting.title || null,
        posting.Organization?.name || null
      ),
      reference: billing.reference,
      metadata: {
        jobPostingId: String(posting.id),
        organizationId: String(posting.organizationId),
        organizationName: posting.Organization?.name || '',
        userId: String(sessionUserId),
        source: 'stujo',
      },
      invoiceRow: {
        // The platform (not the employer) is the selling organization.
        organizationId: Number.isInteger(sellerOrgId) ? sellerOrgId : posting.organizationId,
        userId: sessionUserId,
        jobPostingId: posting.id,
      },
      publish: async () => {
        const publishedAt = new Date();
        const expiresAt = new Date(publishedAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
        const result = await client.request(PUBLISH_POSTING_IF_PUBLISHABLE, {
          id: posting.id,
          publishedAt: publishedAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
        });
        if (result.update_JobPosting.affected_rows !== 1) {
          const error = new Error('Posting was published concurrently');
          error.code = POSTING_NOT_PUBLISHABLE;
          throw error;
        }
        published = { publishedAt, expiresAt };
        return published;
      },
    });
  } catch (error) {
    // Most likely the bank transfer capability is not active on the account.
    logger.error('Could not issue the bank transfer invoice', {
      jobPostingId: posting.id,
      publishedAlready: Boolean(published),
      error: error.message,
    });
    if (published) {
      // The posting is live but the invoice is not finalized: needs a human,
      // not a retry that would publish (and bill) a second time. Not deduped
      // on the posting, so an earlier publication's notice cannot swallow it.
      if (process.env.STUJO_ADMIN_EMAIL) {
        await sendJobPostingMail(
          client,
          logger,
          'JOB_POSTING_ADMIN_NOTICE',
          process.env.STUJO_ADMIN_EMAIL,
          buildJobPostingMailVars(posting, {
            expiresAt: published.expiresAt,
            publishedAt: published.publishedAt,
            paymentDescription:
              `Rechnung NICHT ausgestellt – bitte manuell prüfen (Stripe-Entwurf ` +
              `${error.stripeInvoiceId ?? 'unbekannt'}, Fehler: ${error.message})`,
          }),
          null,
          {
            Invoice: false,
            InvoicePdf: false,
            InvoiceLink: false,
            InvoicePending: false,
            TermsAccepted: Boolean(posting.termsAcceptedAt),
          }
        );
      }
      return {
        success: true,
        published: true,
        paid: false,
        expiresAt: published.expiresAt.toISOString(),
      };
    }
    if (error.code === POSTING_NOT_PUBLISHABLE) {
      return { success: false, error: error.message, messageKey: 'INVALID_STATUS' };
    }
    return { success: false, error: error.message, messageKey: 'INVOICE_PAYMENT_FAILED' };
  }

  const { invoice, grossTotal, netTotal } = issued;
  const { publishedAt, expiresAt } = published;
  const dueDate = invoice.due_date ? new Date(invoice.due_date * 1000) : null;
  const formattedGross = formatJobPostingAmount(grossTotal, currency);
  const invoiceMail = {
    number: invoice.number || `STUJO-${invoice.id}`,
    date: new Date(),
    hostedUrl: invoice.hosted_invoice_url ?? null,
    netTotal,
    vatTotal: grossTotal - netTotal,
    grossTotal,
    currency,
    paid: false,
  };
  const vars = buildJobPostingMailVars(posting, {
    expiresAt,
    publishedAt,
    paymentDescription: dueDate
      ? buildInvoicePaymentDescription(formattedGross, dueDate, formatJobPostingDate)
      : `${formattedGross} per Rechnung (Überweisung)`,
    invoice: invoiceMail,
  });
  const pdfUrl = invoice.invoice_pdf ?? null;
  const flags = {
    Invoice: true,
    InvoicePdf: Boolean(pdfUrl),
    InvoiceLink: Boolean(invoiceMail.hostedUrl),
    InvoicePending: !pdfUrl && !invoiceMail.hostedUrl,
    TermsAccepted: Boolean(posting.termsAcceptedAt),
  };

  // The confirmation is deduped per posting (MailLog_job_posting_mail_unique),
  // so a repost of an expired posting cannot queue it again. Then Stripe
  // sends this invoice itself, so its bank details still reach the employer.
  const alreadyMailed = await hasQueuedPublishedMail(client, posting.id);
  if (alreadyMailed) {
    try {
      await stripe.invoices.sendInvoice(invoice.id);
    } catch (error) {
      logger.error('Could not send the repost invoice through Stripe', {
        jobPostingId: posting.id,
        stripeInvoiceId: invoice.id,
        error: error.message,
      });
    }
  } else if (posting.ContactUser?.email) {
    await sendJobPostingMail(
      client,
      logger,
      'JOB_POSTING_PUBLISHED',
      posting.ContactUser.email,
      vars,
      null,
      flags,
      posting.id,
      pdfUrl
        ? [
            {
              url: pdfUrl,
              filename: `rechnung-${invoiceMail.number.replace(/[^A-Za-z0-9._-]+/g, '-')}.pdf`,
              contentType: 'application/pdf',
            },
          ]
        : null
    );
  }
  if (process.env.STUJO_ADMIN_EMAIL) {
    await sendJobPostingMail(
      client,
      logger,
      'JOB_POSTING_ADMIN_NOTICE',
      process.env.STUJO_ADMIN_EMAIL,
      vars,
      null,
      { ...flags, InvoicePdf: false },
      posting.id
    );
  }

  logger.info('Published job posting on invoice', {
    jobPostingId: posting.id,
    stripeInvoiceId: invoice.id,
  });
  return { success: true, published: true, paid: false, expiresAt: expiresAt.toISOString() };
}

export default async function publishJobPosting(req, logger) {
  logger.info('########## Publish Job Posting ##########');

  try {
    const sessionUserId = req.body?.session_variables?.['x-hasura-user-id'];
    const sessionRole = req.body?.session_variables?.['x-hasura-role'];
    const { jobPostingId, acceptTerms, paymentMethod, billing: billingInput } =
      req.body.input || req.body;

    if (!jobPostingId) {
      return { success: false, error: 'jobPostingId is required', messageKey: 'MISSING_JOB_POSTING_ID' };
    }
    if (!sessionUserId) {
      return { success: false, error: 'Missing authenticated session user', messageKey: 'UNAUTHORIZED' };
    }

    const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
      headers: { 'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET },
    });

    const data = await client.request(GET_POSTING, { id: jobPostingId });
    const posting = data.JobPosting_by_pk;
    if (!posting) {
      return { success: false, error: 'Job posting not found', messageKey: 'JOB_POSTING_NOT_FOUND' };
    }

    // Authorization: admins pass, everyone else needs a canManageJobs grant.
    const isAdmin = sessionRole === 'admin';
    const hasGrant = posting.Organization?.OrganizationAdmins?.some(
      (grant) => String(grant.userId) === String(sessionUserId) && grant.canManageJobs === true
    );
    if (!isAdmin && !hasGrant) {
      return { success: false, error: 'Not authorized to publish this posting', messageKey: 'UNAUTHORIZED' };
    }

    // A DEACTIVATED posting whose window has ended is effectively EXPIRED
    // until the daily expire_job_postings cron flips it; within its window it
    // is reactivated for free via setJobPostingActive instead.
    const deactivatedAndExpired =
      posting.status === 'DEACTIVATED' &&
      (!posting.expiresAt || new Date(posting.expiresAt) <= new Date());
    if (!['DRAFT', 'EXPIRED', 'PENDING_PAYMENT'].includes(posting.status) && !deactivatedAndExpired) {
      return {
        success: false,
        error: `Posting in status ${posting.status} cannot be published`,
        messageKey: 'INVALID_STATUS',
      };
    }

    // Consent is server-controlled: the client may say it was given, but only
    // this function writes the timestamp, and only once. A client-writable
    // column could be backdated or forged, which would defeat the point of
    // recording it at all.
    if (acceptTerms === true && !posting.termsAcceptedAt) {
      await client.request(SET_TERMS_ACCEPTED, {
        id: posting.id,
        at: new Date().toISOString(),
      });
      posting.termsAcceptedAt = new Date().toISOString();
    }

    const priceRow = data.JobPostingPrice.find((p) => p.jobPostingType === posting.type);
    const netPrice = priceRow?.price ?? 0;
    const durationDays = priceRow?.durationDays ?? DEFAULT_DURATION_DAYS;

    // 1. Free posting types publish directly.
    if (netPrice === 0) {
      const { expiresAt } = await publishAndNotify(
        client,
        logger,
        { ...posting, paymentDescription: 'kostenlos' },
        durationDays
      );
      return { success: true, published: true, paid: false, expiresAt: expiresAt.toISOString() };
    }

    // 2. Consume a credit when one is available. An unlimited grant (admin
    // "Unbegrenzt") publishes for free without decrementing; among countable
    // credits a type-specific one wins over the generic one.
    const creditData = await client.request(GET_CREDIT, {
      organizationId: posting.organizationId,
      type: posting.type,
    });
    const credit = creditData.JobPostingCredit?.[0];
    if (credit?.unlimited) {
      const { expiresAt } = await publishAndNotify(
        client,
        logger,
        { ...posting, paymentDescription: 'Kontingent (unbegrenzt)' },
        durationDays
      );
      return {
        success: true,
        published: true,
        paid: false,
        usedCredit: true,
        expiresAt: expiresAt.toISOString(),
      };
    }
    if (credit) {
      const consumed = await client.request(CONSUME_CREDIT, {
        id: credit.id,
        currentRemaining: credit.remaining,
      });
      if (consumed.update_JobPostingCredit.affected_rows === 1) {
        const { expiresAt } = await publishAndNotify(
          client,
          logger,
          { ...posting, paymentDescription: 'Kontingent' },
          durationDays
        );
        return { success: true, published: true, paid: false, usedCredit: true, expiresAt: expiresAt.toISOString() };
      }
      logger.warn('Credit was consumed concurrently, falling through to checkout', { creditId: credit.id });
    }

    // 3. Stripe checkout.
    // Only the paid path is gated: this is where a contract is concluded, and
    // it mirrors `config.requiresPayment && !acceptTerms` in the course
    // registration modal. A repost of a posting that already carries consent
    // passes without asking again.
    if (!posting.termsAcceptedAt) {
      return {
        success: false,
        error: 'Terms must be accepted before publishing a paid posting',
        messageKey: 'TERMS_NOT_ACCEPTED',
      };
    }

    // "Kauf auf Rechnung" is checked before any Stripe call, so a refused or
    // incomplete request never leaves a customer or draft invoice behind.
    const payByInvoice = paymentMethod === 'INVOICE';
    let billing = null;
    let invoiceOrganization = null;
    if (payByInvoice) {
      invoiceOrganization = await loadInvoiceOrganization(client, posting.organizationId);
      if (!invoiceOrganization?.allowInvoicePayment) {
        return {
          success: false,
          error: 'Invoice payment is not enabled for this organization',
          messageKey: 'INVOICE_PAYMENT_NOT_ALLOWED',
        };
      }
      const normalized = normalizeBillingInput(billingInput);
      if (normalized.error) {
        return { success: false, error: 'Billing address is incomplete', messageKey: normalized.error };
      }
      billing = normalized.billing;
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return { success: false, error: 'Stripe secret key not configured', messageKey: 'STRIPE_NOT_CONFIGURED' };
    }
    const frontendUrl = process.env.STUJO_FRONTEND_URL || process.env.FRONTEND_URL;
    if (!frontendUrl) {
      return { success: false, error: 'Frontend URL not configured', messageKey: 'FRONTEND_URL_NOT_CONFIGURED' };
    }

    const stripe = new Stripe(stripeSecretKey);
    const currency = (priceRow?.currency || 'EUR').toLowerCase();

    // Prefer the bootstrapped Stripe price (createStripeJobPostingPrices),
    // fall back to dynamic pricing — same validation approach as the course
    // checkout in createStripeCheckout/index.js.
    let lineItem = null;
    if (priceRow?.stripePriceId) {
      try {
        const stripePrice = await stripe.prices.retrieve(priceRow.stripePriceId);
        if (
          stripePrice.active === true &&
          stripePrice.type === 'one_time' &&
          stripePrice.currency?.toLowerCase() === currency &&
          stripePrice.unit_amount === netPrice
        ) {
          lineItem = { price: priceRow.stripePriceId, quantity: 1 };
        }
      } catch (error) {
        logger.warn('Stripe price validation failed, using dynamic pricing', { error: error.message });
      }
    }
    if (!lineItem) {
      lineItem = {
        price_data: {
          currency,
          product_data: { name: `StuJo Stellenanzeige: ${posting.type}` },
          unit_amount: netPrice,
        },
        quantity: 1,
      };
    }

    // Fixed 19% exclusive German VAT on the net price. STRIPE_TAX_RATE_ID is
    // an optional override (e.g. pin the rate verified against the live
    // account); when unset we find-or-create the matching rate on the fly,
    // mirroring the course checkout flow so no manual bootstrap step is
    // required. The createStripeJobPostingPrices action creates the same rate.
    let taxRateId = process.env.STRIPE_TAX_RATE_ID || null;
    if (!taxRateId) {
      taxRateId = await getOrCreateTaxRate(stripe, 19, false, logger);
    }
    if (taxRateId) {
      lineItem.tax_rates = [taxRateId];
    } else {
      logger.warn('Could not resolve a 19% VAT tax rate — charging net price without VAT line');
    }

    // The platform organization sells the posting; its invoice footer and
    // tax notes go onto the Stripe invoice (production review 2026-07-11).
    let sellerOrganization = null;
    const sellerOrgId = Number.parseInt(process.env.STUJO_SELLER_ORGANIZATION_ID || '', 10);
    if (Number.isInteger(sellerOrgId)) {
      try {
        const sellerData = await client.request(
          gql`
            query GetStujoSellerOrganization($id: Int!) {
              Organization_by_pk(id: $id) {
                id
                invoiceFooterText
                defaultVatRate
                defaultTaxExemptionNote
              }
            }
          `,
          { id: sellerOrgId }
        );
        sellerOrganization = sellerData.Organization_by_pk;
      } catch (error) {
        logger.warn('Could not load seller organization for invoice footer', { error: error.message });
      }
    }

    // A named customer keeps an organization's postings and their
    // invoices on one record; without a contact email Stripe creates one
    // during checkout instead.
    let customerId = null;
    if (posting.ContactUser?.email) {
      customerId = await getOrCreateCustomer(
        stripe,
        posting.ContactUser.email,
        posting.Organization?.name || null
      );
    }

    if (payByInvoice) {
      return await publishByInvoice({
        stripe,
        client,
        logger,
        posting,
        billing,
        invoiceOrganization,
        customerId,
        lineItem,
        currency,
        sellerOrganization,
        sellerOrgId,
        sessionUserId,
        durationDays,
      });
    }

    const sessionConfig = {
      line_items: [lineItem],
      mode: 'payment',
      // Card and SEPA direct debit; the latter settles via the
      // checkout.session.async_payment_* events.
      ...buildPaymentMethodConfig(customerId),
      // Stripe issues a real, sequentially numbered invoice (§14 UStG).
      invoice_creation: buildInvoiceCreation(sellerOrganization),
      success_url: `${frontendUrl}/mein-stujo?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/mein-stujo?payment=cancelled&posting=${posting.id}`,
      metadata: {
        jobPostingId: String(posting.id),
        organizationId: String(posting.organizationId),
        organizationName: posting.Organization?.name || '',
        // The buying user for the Invoice row created by the webhook.
        userId: String(sessionUserId),
        source: 'stujo',
      },
      payment_intent_data: {
        // Without this Stripe shows the PaymentIntent id in the dashboard's
        // payment list instead of what was sold.
        description: buildJobPostingPaymentDescription(
          posting.title || null,
          posting.Organization?.name || null
        ),
        metadata: {
          jobPostingId: String(posting.id),
          organizationId: String(posting.organizationId),
          organizationName: posting.Organization?.name || '',
          source: 'stujo',
        },
      },
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);
    await client.request(SET_PENDING_PAYMENT, { id: posting.id });

    logger.info('Created Stripe Checkout Session for job posting', {
      sessionId: session.id,
      jobPostingId: posting.id,
    });

    return { success: true, published: false, paid: true, checkoutUrl: session.url, sessionId: session.id };
  } catch (error) {
    logger.error('Error in publishJobPosting', { error: error.message, stack: error.stack });
    return { success: false, error: error.message || 'Internal server error', messageKey: 'PUBLISH_JOB_POSTING_ERROR' };
  }
}
