import Stripe from 'stripe';
import { GraphQLClient, gql } from 'graphql-request';

/**
 * Single entry point for publishing a StuJo job posting (phase 4 of
 * docs/STUJO_INTEGRATION_PLAN.md).
 *
 * Flow (agreed 2026-07-10):
 * - Free type (price 0, e.g. MINIJOB)  -> publish immediately
 * - Available JobPostingCredit          -> consume one credit, publish
 * - Otherwise                           -> status PENDING_PAYMENT + Stripe
 *   Checkout Session (card, SEPA debit, bank transfer; net price + fixed
 *   19% VAT). The webhook publishes on checkout.session.completed.
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
      organizationId
      contactUserId
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
        remaining: { _gt: 0 }
        _or: [{ jobPostingType: { _eq: $type } }, { jobPostingType: { _is_null: true } }]
      }
      order_by: { jobPostingType: desc_nulls_last }
      limit: 1
    ) {
      id
      remaining
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

const SET_PENDING_PAYMENT = gql`
  mutation SetJobPostingPendingPayment($id: Int!) {
    update_JobPosting_by_pk(pk_columns: { id: $id }, _set: { status: PENDING_PAYMENT }) {
      id
      status
    }
  }
`;

const GET_MAIL_TEMPLATE = gql`
  query GetJobMailTemplate($type: String!) {
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
  ) {
    insert_MailLog_one(
      object: {
        subject: $subject
        content: $content
        from: $from
        to: $to
        bcc: $bcc
        status: $status
      }
    ) {
      id
    }
  }
`;

// The publication window falls back to the StuJo default (8 weeks) if the
// price row is missing a duration.
const DEFAULT_DURATION_DAYS = 56;

export function replaceJobPostingVariables(text, vars) {
  let result = text || '';
  for (const [key, value] of Object.entries(vars)) {
    result = result.split(key).join(value ?? '');
  }
  return result;
}

export async function sendJobPostingMail(client, logger, templateType, to, vars, bcc = null) {
  try {
    const templateData = await client.request(GET_MAIL_TEMPLATE, { type: templateType });
    const template = templateData?.MailTemplate?.[0];
    if (!template) {
      logger.warn(`Mail template ${templateType} not found, skipping mail`);
      return;
    }
    await client.request(INSERT_MAIL_LOG, {
      subject: replaceJobPostingVariables(template.subject, vars),
      content: replaceJobPostingVariables(template.content, vars),
      from: template.from || 'noreply@stujo.net',
      to,
      bcc: bcc || template.bcc || null,
      status: 'READY_TO_SEND',
    });
  } catch (error) {
    // Mails must never break the publish flow.
    logger.error(`Failed to queue ${templateType} mail`, { error: error.message });
  }
}

export async function publishAndNotify(client, logger, posting, durationDays) {
  const publishedAt = new Date();
  const expiresAt = new Date(publishedAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
  await client.request(PUBLISH_POSTING, {
    id: posting.id,
    publishedAt: publishedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });

  const frontendUrl = process.env.STUJO_FRONTEND_URL || process.env.FRONTEND_URL || '';
  const vars = {
    '[JobPosting:Title]': posting.title,
    '[JobPosting:Type]': posting.type,
    '[JobPosting:ExpiresAt]': expiresAt.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    '[JobPosting:DashboardUrl]': `${frontendUrl}/mein-stujo`,
    '[JobPosting:RepostUrl]': `${frontendUrl}/mein-stujo?repost=${posting.id}`,
    '[JobPosting:AdminUrl]': `${frontendUrl}/manage/jobboerse?posting=${posting.id}`,
    '[Organization:Name]': posting.Organization?.name || '',
    '[JobPosting:Payment]': posting.paymentDescription || '',
  };

  if (posting.ContactUser?.email) {
    await sendJobPostingMail(client, logger, 'JOB_POSTING_PUBLISHED', posting.ContactUser.email, vars);
  }
  const adminMail = process.env.STUJO_ADMIN_EMAIL;
  if (adminMail) {
    await sendJobPostingMail(client, logger, 'JOB_POSTING_ADMIN_NOTICE', adminMail, vars);
  }
  return { publishedAt, expiresAt };
}

export default async function publishJobPosting(req, logger) {
  logger.info('########## Publish Job Posting ##########');

  try {
    const sessionUserId = req.body?.session_variables?.['x-hasura-user-id'];
    const sessionRole = req.body?.session_variables?.['x-hasura-role'];
    const { jobPostingId } = req.body.input || req.body;

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

    if (!['DRAFT', 'EXPIRED', 'PENDING_PAYMENT'].includes(posting.status)) {
      return {
        success: false,
        error: `Posting in status ${posting.status} cannot be published`,
        messageKey: 'INVALID_STATUS',
      };
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

    // 2. Consume a credit when one is available (type-specific wins over generic).
    const creditData = await client.request(GET_CREDIT, {
      organizationId: posting.organizationId,
      type: posting.type,
    });
    const credit = creditData.JobPostingCredit?.[0];
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

    // Fixed 19% German VAT on the net price. STRIPE_TAX_RATE_ID is created
    // by the createStripeJobPostingPrices bootstrap function.
    const taxRateId = process.env.STRIPE_TAX_RATE_ID;
    if (taxRateId) {
      lineItem.tax_rates = [taxRateId];
    } else {
      logger.warn('STRIPE_TAX_RATE_ID not set — charging net price without VAT line');
    }

    const sessionConfig = {
      line_items: [lineItem],
      mode: 'payment',
      // Agreed payment methods: card, SEPA direct debit, bank transfer
      // (pay later, parity with the old invoice flow).
      payment_method_types: ['card', 'sepa_debit', 'customer_balance'],
      payment_method_options: {
        customer_balance: {
          funding_type: 'bank_transfer',
          bank_transfer: { type: 'eu_bank_transfer', eu_bank_transfer: { country: 'DE' } },
        },
      },
      customer_creation: 'always',
      success_url: `${frontendUrl}/mein-stujo?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/mein-stujo?payment=cancelled&posting=${posting.id}`,
      metadata: {
        jobPostingId: String(posting.id),
        organizationId: String(posting.organizationId),
        // The buying user for the Invoice row created by the webhook.
        userId: String(sessionUserId),
        source: 'stujo',
      },
      payment_intent_data: {
        metadata: { jobPostingId: String(posting.id), source: 'stujo' },
      },
    };
    if (posting.ContactUser?.email) {
      sessionConfig.customer_email = posting.ContactUser.email;
    }

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
