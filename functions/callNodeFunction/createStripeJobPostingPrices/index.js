import Stripe from 'stripe';
import { GraphQLClient, gql } from 'graphql-request';

/**
 * One-time bootstrap for the StuJo job board payments (admin action):
 * - Creates a Stripe product + one-time price per paid JobPostingType and
 *   stores the price id in JobPostingPrice.stripePriceId (idempotent:
 *   existing valid price ids are kept).
 * - Ensures a fixed 19% German VAT TaxRate exists and reports its id,
 *   which must be set as STRIPE_TAX_RATE_ID on the functions environment.
 *
 * Run against test-mode keys first (agreed 2026-07-10); re-run after
 * switching to the live account before cutover.
 */

const GET_PRICES = gql`
  query GetJobPostingPrices {
    JobPostingPrice {
      id
      jobPostingType
      price
      currency
      vatRate
      stripePriceId
    }
  }
`;

const SET_STRIPE_PRICE_ID = gql`
  mutation SetStripePriceId($id: Int!, $stripePriceId: String!) {
    update_JobPostingPrice_by_pk(pk_columns: { id: $id }, _set: { stripePriceId: $stripePriceId }) {
      id
    }
  }
`;

const PRODUCT_NAMES = {
  MINIJOB: 'StuJo Stellenanzeige: Minijob',
  WORKING_STUDENT: 'StuJo Stellenanzeige: Studentenjob',
  INTERNSHIP: 'StuJo Stellenanzeige: Praktikum',
  THESIS: 'StuJo Stellenanzeige: Abschlussarbeit',
  PERMANENT: 'StuJo Stellenanzeige: Festanstellung',
  TRAINEE: 'StuJo Stellenanzeige: Trainee',
  STATE_RECOGNITION_INTERNSHIP: 'StuJo Stellenanzeige: Praktikum (staatl. Anerkennung)',
};

export default async function createStripeJobPostingPrices(req, logger) {
  logger.info('########## Create Stripe Job Posting Prices ##########');

  try {
    const sessionRole = req.body?.session_variables?.['x-hasura-role'];
    if (sessionRole !== 'admin') {
      return { success: false, error: 'Admin only', messageKey: 'UNAUTHORIZED' };
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return { success: false, error: 'Stripe secret key not configured', messageKey: 'STRIPE_NOT_CONFIGURED' };
    }
    const stripe = new Stripe(stripeSecretKey);

    const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
      headers: { 'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET },
    });

    // 1. Ensure the fixed 19% VAT tax rate exists.
    let taxRateId = process.env.STRIPE_TAX_RATE_ID || null;
    if (taxRateId) {
      try {
        const existing = await stripe.taxRates.retrieve(taxRateId);
        if (!existing.active || existing.percentage !== 19 || existing.inclusive) {
          logger.warn('Configured STRIPE_TAX_RATE_ID is not an active exclusive 19% rate', { taxRateId });
          taxRateId = null;
        }
      } catch {
        taxRateId = null;
      }
    }
    if (!taxRateId) {
      const taxRate = await stripe.taxRates.create({
        display_name: 'MwSt.',
        description: 'Deutsche Mehrwertsteuer (StuJo Stellenanzeigen)',
        percentage: 19,
        inclusive: false,
        country: 'DE',
      });
      taxRateId = taxRate.id;
      logger.info(`Created Stripe TaxRate ${taxRateId} — set STRIPE_TAX_RATE_ID=${taxRateId} on the functions environment`);
    }

    // 2. Product + price per paid posting type.
    const { JobPostingPrice: rows } = await client.request(GET_PRICES);
    const results = [];
    for (const row of rows) {
      if (!row.price || row.price <= 0) {
        results.push({ type: row.jobPostingType, skipped: 'free' });
        continue;
      }

      // Keep an existing price id when it still matches.
      if (row.stripePriceId) {
        try {
          const existing = await stripe.prices.retrieve(row.stripePriceId);
          if (
            existing.active &&
            existing.type === 'one_time' &&
            existing.unit_amount === row.price &&
            existing.currency?.toLowerCase() === (row.currency || 'EUR').toLowerCase()
          ) {
            results.push({ type: row.jobPostingType, stripePriceId: row.stripePriceId, kept: true });
            continue;
          }
        } catch {
          // fall through and create a new price
        }
      }

      const product = await stripe.products.create({
        name: PRODUCT_NAMES[row.jobPostingType] || `StuJo Stellenanzeige: ${row.jobPostingType}`,
        metadata: { source: 'stujo', jobPostingType: row.jobPostingType },
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: row.price,
        currency: (row.currency || 'EUR').toLowerCase(),
        tax_behavior: 'exclusive',
        metadata: { source: 'stujo', jobPostingType: row.jobPostingType },
      });
      await client.request(SET_STRIPE_PRICE_ID, { id: row.id, stripePriceId: price.id });
      results.push({ type: row.jobPostingType, stripePriceId: price.id, created: true });
      logger.info(`Created Stripe price for ${row.jobPostingType}`, { priceId: price.id, amount: row.price });
    }

    // Only fields declared on CreateStripeJobPostingPricesResult may be
    // returned (Hasura validates action responses); details go to the log.
    logger.info('Stripe job posting price bootstrap finished', { results });
    return { success: true, taxRateId };
  } catch (error) {
    logger.error('Error in createStripeJobPostingPrices', { error: error.message, stack: error.stack });
    return { success: false, error: error.message || 'Internal server error', messageKey: 'STRIPE_BOOTSTRAP_ERROR' };
  }
}
