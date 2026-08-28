/**
 * Shared Stripe tax helpers (production-readiness review 2026-07-11).
 *
 * German VAT rules applied across both checkout flows:
 * - Course prices (B2C) are GROSS (consumer prices must include VAT), so
 *   they get an INCLUSIVE tax rate at the selling organization's
 *   defaultVatRate; Stripe then reports the contained tax portion.
 * - Job posting prices (B2B) are NET and get the EXCLUSIVE 19% rate
 *   (see publishJobPosting).
 * - defaultVatRate 0/null means tax-exempt (e.g. §4 Nr. 21 UStG for
 *   education); the organization's defaultTaxExemptionNote must then
 *   appear on the invoice (invoice_data.footer).
 */

/**
 * Finds an active Stripe TaxRate matching percentage/inclusivity, creating
 * it when absent. Rates are reused across sessions so the Stripe account
 * doesn't accumulate duplicates.
 *
 * @param {import('stripe').Stripe} stripe
 * @param {number} percentage - e.g. 19 or 7
 * @param {boolean} inclusive - true for gross (B2C) prices
 * @param {Object} logger
 * @returns {Promise<string|null>} tax rate id, or null for percentage <= 0
 */
export async function getOrCreateTaxRate(stripe, percentage, inclusive, logger) {
  if (!percentage || percentage <= 0) {
    return null;
  }

  const existing = await stripe.taxRates.list({ active: true, limit: 100 });
  const match = existing.data.find(
    (rate) =>
      rate.percentage === percentage &&
      rate.inclusive === inclusive &&
      rate.country === 'DE'
  );
  if (match) {
    return match.id;
  }

  const created = await stripe.taxRates.create({
    display_name: 'MwSt.',
    description: `Deutsche Mehrwertsteuer ${percentage}% (${inclusive ? 'inklusive' : 'zzgl.'})`,
    percentage,
    inclusive,
    country: 'DE',
  });
  logger.info(`Created Stripe TaxRate ${created.id} (${percentage}%, inclusive=${inclusive})`);
  return created.id;
}

/**
 * Builds the invoice_creation block for a Checkout Session so Stripe
 * issues a real, sequentially numbered invoice document (§14 UStG).
 *
 * @param {Object} organization - row with invoiceFooterText,
 *   defaultVatRate, defaultTaxExemptionNote (all optional)
 * @returns {Object} invoice_creation config
 */
export function buildInvoiceCreation(organization) {
  const footerParts = [];
  if (organization?.invoiceFooterText) {
    footerParts.push(organization.invoiceFooterText);
  }
  const vatRate = organization?.defaultVatRate != null ? Number(organization.defaultVatRate) : null;
  if ((vatRate === 0 || vatRate === null) && organization?.defaultTaxExemptionNote) {
    footerParts.push(organization.defaultTaxExemptionNote);
  }
  const invoiceData = {};
  if (footerParts.length > 0) {
    // Stripe caps the footer at 5000 chars; ours are short legal notes.
    invoiceData.footer = footerParts.join('\n');
  }
  return { enabled: true, ...(Object.keys(invoiceData).length ? { invoice_data: invoiceData } : {}) };
}

/**
 * Finds (by email) or creates the Stripe Customer for a checkout, so
 * repeat purchases attach to one customer record and its invoices stay
 * together, instead of customer_creation minting a new one each time.
 *
 * @param {import('stripe').Stripe} stripe
 * @param {string} email
 * @param {string|null} name
 * @returns {Promise<string>} customer id
 */
export async function getOrCreateCustomer(stripe, email, name = null) {
  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data.length > 0) {
    return existing.data[0].id;
  }
  const created = await stripe.customers.create({ email, ...(name ? { name } : {}) });
  return created.id;
}

/**
 * Payment methods offered in both flows: card and SEPA direct debit.
 * SEPA settles asynchronously — webhook consumers must handle
 * checkout.session.async_payment_succeeded / _failed.
 *
 * EU bank transfer (customer_balance) was part of the 2026-07-10
 * agreement but is not offered: the capability needs additional
 * verification that the live account does not have, and Checkout
 * rejects the whole session when an unactivated type is listed. Adding
 * it back means one entry here plus its payment_method_options block
 * (funding_type 'bank_transfer', eu_bank_transfer country DE) and a
 * customer on the session. The longer-term direction is to stop
 * hardcoding the list and pass a payment_method_configuration chosen
 * per course instead (issue #1889).
 *
 * @param {string|null} customerId
 */
export function buildPaymentMethodConfig(customerId = null) {
  const types = ['card', 'sepa_debit'];
  if (!customerId) {
    return { payment_method_types: types, customer_creation: 'always' };
  }
  return { customer: customerId, payment_method_types: types };
}
