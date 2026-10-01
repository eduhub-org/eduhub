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

const INVOICE_DATE_FORMAT = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Europe/Berlin',
});

/** dd.mm.yyyy in German time, e.g. "01.10.2026". */
export function formatInvoiceDate(date) {
  return INVOICE_DATE_FORMAT.format(new Date(date));
}

/**
 * Invoice custom field for the time of supply (§14 Abs. 4 Nr. 6 UStG):
 * "Leistungszeitraum" for a start and end, "Leistungsdatum" for a single day.
 *
 * @param {Date|string|null} start
 * @param {Date|string|null} end
 * @returns {{name: string, value: string}|null} null without a start
 */
export function buildServicePeriodField(start, end = null) {
  if (!start) {
    return null;
  }
  const from = formatInvoiceDate(start);
  const to = end ? formatInvoiceDate(end) : null;
  if (!to || to === from) {
    return { name: 'Leistungsdatum', value: from };
  }
  return { name: 'Leistungszeitraum', value: `${from} \u2013 ${to}` };
}

/**
 * Builds the invoice_creation block for a Checkout Session so Stripe
 * issues a real, sequentially numbered invoice document (§14 UStG).
 * Seller address, invoice email, VAT ID and the number prefix come from
 * the Stripe account settings (docs/STRIPE_INTEGRATION.md), not from here.
 *
 * @param {Object} organization - row with invoiceFooterText,
 *   defaultVatRate, defaultTaxExemptionNote (all optional)
 * @param {Object} [options]
 * @param {Array<{name: string, value: string}|null>} [options.customFields]
 *   printed in the invoice header (Stripe allows up to four)
 * @param {Object|null} [options.metadata] - copied onto the invoice object
 * @returns {Object} invoice_creation config
 */
export function buildInvoiceCreation(organization, { customFields = [], metadata = null } = {}) {
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
  const fields = customFields.filter(Boolean);
  if (fields.length > 0) {
    invoiceData.custom_fields = fields;
  }
  if (metadata) {
    invoiceData.metadata = metadata;
  }
  return { enabled: true, ...(Object.keys(invoiceData).length ? { invoice_data: invoiceData } : {}) };
}

/**
 * Readable label per ProgramType enum value for the payment description.
 * An unknown value falls through to the raw enum rather than vanishing,
 * so a program type added later still shows something useful.
 */
const PROGRAM_TYPE_LABELS = {
  COURSES: 'Kurs',
  EVENTS: 'Event',
  DEGREES: 'Degree',
};

// Stripe accepts long descriptions, but the dashboard's payment list is one
// line — keep the title short enough that the organization stays visible.
const TITLE_MAX_LENGTH = 120;

function shortenTitle(title) {
  if (!title) {
    return null;
  }
  return title.length > TITLE_MAX_LENGTH ? `${title.slice(0, TITLE_MAX_LENGTH - 1)}\u2026` : title;
}

/**
 * App, then seller, then what was bought, with the kind of offering in
 * brackets at the end. Missing parts drop out rather than printing null.
 */
function buildDescription(app, organizationName, title, typeLabel) {
  const text = [app, organizationName, shortenTitle(title)].filter(Boolean).join(' ');
  return typeLabel ? `${text} (${typeLabel})` : text;
}

/**
 * Stripe metadata.source for a course/event/degree purchase, so the
 * dashboard can tell the offerings apart from StuJo ('stujo'). An unknown or
 * missing program type keeps the old generic 'eduhub'.
 *
 * @param {string|null} programType - Program.type (COURSES, EVENTS, DEGREES)
 * @returns {string}
 */
export function buildCourseSource(programType) {
  return PROGRAM_TYPE_LABELS[programType] ? programType.toLowerCase() : 'eduhub';
}

/**
 * Description for a course/event/degree enrollment payment, e.g.
 * "EduHub opencampus Design Thinking (Kurs)".
 *
 * Without a description Stripe prints the PaymentIntent id in the
 * dashboard's payment list, which is unreadable next to the other
 * integrations settling on the same account.
 *
 * @param {string|null} programType - Program.type (COURSES, EVENTS, DEGREES)
 * @param {string|null} title - course title
 * @param {string|null} organizationName - selling organization
 * @returns {string}
 */
export function buildCoursePaymentDescription(programType, title, organizationName) {
  const label = PROGRAM_TYPE_LABELS[programType] || programType || null;
  return buildDescription('EduHub', organizationName, title, label);
}

/**
 * Description for a StuJo job posting payment, e.g.
 * "StuJo ACME GmbH Werkstudent Frontend (Stellenanzeige)" — same shape as
 * the course one so the dashboard's payment list scans consistently.
 *
 * @param {string|null} title - posting title
 * @param {string|null} organizationName - posting organization
 * @returns {string}
 */
export function buildJobPostingPaymentDescription(title, organizationName) {
  return buildDescription('StuJo', organizationName, title, 'Stellenanzeige');
}

const INVOICE_LOCALE = 'de';

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
    const customer = existing.data[0];
    // Stripe renders invoices in the customer's locale; customers created
    // before German invoices keep English ones until this is set.
    if (!customer.preferred_locales?.length) {
      await stripe.customers.update(customer.id, { preferred_locales: [INVOICE_LOCALE] });
    }
    return customer.id;
  }
  const created = await stripe.customers.create({
    email,
    ...(name ? { name } : {}),
    preferred_locales: [INVOICE_LOCALE],
  });
  return created.id;
}

/**
 * Payment methods offered in both flows: card and SEPA direct debit.
 * SEPA settles asynchronously — webhook consumers must handle
 * checkout.session.async_payment_succeeded / _failed.
 *
 * EU bank transfer (customer_balance) is deliberately not offered in
 * Checkout: Checkout rejects the whole session when an unactivated type is
 * listed. StuJo employers who need to pay by transfer use "Kauf auf
 * Rechnung" instead (publishJobPosting/invoicePayment.js), which issues a
 * Stripe invoice with customer_balance and is limited to organizations an
 * admin approved. Adding it here would mean one entry plus its
 * payment_method_options block (funding_type 'bank_transfer',
 * eu_bank_transfer country DE) and a customer on the session. The
 * longer-term direction is to stop
 * hardcoding the list and pass a payment_method_configuration chosen
 * per course instead (issue #1889).
 *
 * @param {string|null} customerId
 */
export function buildPaymentMethodConfig(customerId = null) {
  const types = ['card', 'sepa_debit'];
  // §14 UStG: the invoice must carry the buyer's full address. The tax ID
  // is optional and lets a business buyer's USt-IdNr. print on the invoice.
  const billing = {
    billing_address_collection: 'required',
    tax_id_collection: { enabled: true },
  };
  if (!customerId) {
    return { payment_method_types: types, customer_creation: 'always', ...billing };
  }
  return {
    customer: customerId,
    payment_method_types: types,
    ...billing,
    // Stripe requires this for tax_id_collection on an existing customer;
    // it also saves the entered address for the invoice.
    customer_update: { name: 'auto', address: 'auto' },
  };
}
