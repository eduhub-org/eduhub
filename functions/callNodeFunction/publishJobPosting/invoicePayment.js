import { gql } from 'graphql-request';

/**
 * "Kauf auf Rechnung" for StuJo job postings.
 *
 * Some employers (public-sector institutions in particular) cannot pay by
 * card or direct debit. For organizations a StuJo admin has approved
 * (Organization.allowInvoicePayment) the paid path skips Checkout and issues
 * a Stripe invoice instead:
 *
 * - collection_method send_invoice, due in INVOICE_DAYS_UNTIL_DUE days;
 * - paid by EU bank transfer (customer_balance). Stripe gives each customer a
 *   virtual IBAN, printed on the invoice, and reconciles incoming transfers
 *   itself -- the webhook's invoice.paid then flips our Invoice row to PAID;
 * - the posting is published right away (post first, pay later), the same
 *   trade-off already made for SEPA debit.
 *
 * Requires the "Bank transfers" payment method to be activated on the Stripe
 * account; without it Stripe rejects the invoice and the employer gets
 * INVOICE_PAYMENT_FAILED.
 */

export const INVOICE_DAYS_UNTIL_DUE = 30;

/** error.code thrown by `publish` when another request published first. */
export const POSTING_NOT_PUBLISHABLE = 'POSTING_NOT_PUBLISHABLE';

// Stripe caps invoice custom field values at 140 characters.
const REFERENCE_MAX_LENGTH = 140;
const FIELD_MAX_LENGTH = 200;

const REQUIRED_BILLING_FIELDS = ['legalName', 'addressLine1', 'postalCode', 'city', 'country'];
const OPTIONAL_BILLING_FIELDS = ['addressLine2', 'vatId', 'reference'];

const INSERT_JOB_INVOICE = gql`
  mutation InsertJobPostingBankTransferInvoice(
    $organizationId: Int!
    $userId: uuid!
    $jobPostingId: Int!
    $invoiceNumber: String!
    $netTotal: Int!
    $vatTotal: Int!
    $grossTotal: Int!
    $currency: String!
    $stripeInvoiceId: String!
    $notes: String
  ) {
    insert_Invoice_one(
      object: {
        organizationId: $organizationId
        userId: $userId
        jobPostingId: $jobPostingId
        invoiceNumber: $invoiceNumber
        status: ISSUED
        netTotal: $netTotal
        vatTotal: $vatTotal
        grossTotal: $grossTotal
        currency: $currency
        stripeInvoiceId: $stripeInvoiceId
        notes: $notes
      }
    ) {
      id
    }
  }
`;

const BACKFILL_INVOICE_DOCUMENT = gql`
  mutation BackfillJobPostingBankTransferInvoice(
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

// Only fills columns that are still empty: a job-board admin must not
// overwrite billing data a settings admin maintains (canManageSettings).
const GET_ORGANIZATION_BILLING = gql`
  query GetOrganizationBillingForInvoice($id: Int!) {
    Organization_by_pk(id: $id) {
      id
      allowInvoicePayment
      legalName
      addressLine1
      addressLine2
      postalCode
      city
      country
      vatId
    }
  }
`;

const UPDATE_ORGANIZATION_BILLING = gql`
  mutation FillOrganizationBillingFromInvoice($id: Int!, $set: Organization_set_input!) {
    update_Organization_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
    }
  }
`;

const GET_QUEUED_PUBLISHED_MAIL = gql`
  query GetQueuedJobPostingPublishedMail($contains: jsonb!) {
    MailLog(where: { metadata: { _contains: $contains } }, limit: 1) {
      id
    }
  }
`;

/** True when this posting's confirmation mail was queued by an earlier publication. */
export async function hasQueuedPublishedMail(client, jobPostingId) {
  const { MailLog } = await client.request(GET_QUEUED_PUBLISHED_MAIL, {
    contains: { type: 'JOB_POSTING_PUBLISHED', jobPostingId },
  });
  return MailLog.length > 0;
}

const trimOrNull = (value) => {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
};

/**
 * Validates and normalizes the billing input from the order form.
 *
 * @returns {{ billing: Object|null, error: string|null }}
 */
export function normalizeBillingInput(input) {
  if (!input || typeof input !== 'object') {
    return { billing: null, error: 'BILLING_REQUIRED' };
  }
  const billing = {};
  for (const field of [...REQUIRED_BILLING_FIELDS, ...OPTIONAL_BILLING_FIELDS]) {
    billing[field] = trimOrNull(input[field]);
    if (billing[field] && billing[field].length > FIELD_MAX_LENGTH) {
      return { billing: null, error: 'BILLING_FIELD_TOO_LONG' };
    }
  }
  if (REQUIRED_BILLING_FIELDS.some((field) => !billing[field])) {
    return { billing: null, error: 'BILLING_INCOMPLETE' };
  }
  billing.country = billing.country.toUpperCase();
  if (!/^[A-Z]{2}$/.test(billing.country)) {
    return { billing: null, error: 'BILLING_INCOMPLETE' };
  }
  if (billing.vatId) {
    billing.vatId = billing.vatId.replace(/\s+/g, '').toUpperCase();
  }
  if (billing.reference && billing.reference.length > REFERENCE_MAX_LENGTH) {
    return { billing: null, error: 'BILLING_FIELD_TOO_LONG' };
  }
  return { billing, error: null };
}

/**
 * Parameters for the draft Stripe invoice. auto_advance stays false so a
 * draft left behind by a failed request is never finalized or mailed by
 * Stripe on its own.
 */
export function buildBankTransferInvoiceParams({
  customerId,
  currency,
  footer = null,
  description = null,
  reference = null,
  metadata = {},
}) {
  return {
    customer: customerId,
    currency,
    collection_method: 'send_invoice',
    days_until_due: INVOICE_DAYS_UNTIL_DUE,
    auto_advance: false,
    pending_invoice_items_behavior: 'exclude',
    payment_settings: {
      payment_method_types: ['customer_balance'],
      payment_method_options: {
        customer_balance: {
          funding_type: 'bank_transfer',
          bank_transfer: { type: 'eu_bank_transfer', eu_bank_transfer: { country: 'DE' } },
        },
      },
    },
    ...(reference ? { custom_fields: [{ name: 'Bestellnummer', value: reference }] } : {}),
    ...(footer ? { footer } : {}),
    ...(description ? { description } : {}),
    metadata: { ...metadata, paymentMethod: 'INVOICE' },
  };
}

/**
 * Translates the Checkout line item built in publishJobPosting into invoice
 * item parameters: a bootstrapped price stays a price, the dynamic fallback
 * becomes a plain amount.
 */
export function buildInvoiceItemParams({ customerId, invoiceId, lineItem }) {
  const base = {
    customer: customerId,
    invoice: invoiceId,
    ...(lineItem.tax_rates ? { tax_rates: lineItem.tax_rates } : {}),
  };
  if (lineItem.price) {
    return { ...base, pricing: { price: lineItem.price }, quantity: lineItem.quantity ?? 1 };
  }
  return {
    ...base,
    amount: lineItem.price_data.unit_amount * (lineItem.quantity ?? 1),
    currency: lineItem.price_data.currency,
    description: lineItem.price_data.product_data?.name,
  };
}

/** Payment line for the confirmation mail's "Zahlung" section. */
export function buildInvoicePaymentDescription(formattedGross, dueDate, formatDate) {
  return (
    `${formattedGross} per Rechnung (Überweisung). Bitte überweise den Betrag bis zum ` +
    `${formatDate(dueDate)} auf das in der Rechnung angegebene Konto und gib die ` +
    'Rechnungsnummer als Verwendungszweck an.'
  );
}

export async function loadInvoiceOrganization(client, organizationId) {
  const data = await client.request(GET_ORGANIZATION_BILLING, { id: organizationId });
  return data.Organization_by_pk;
}

/** Saves the billing data on the organization where its columns are still empty. */
export async function fillOrganizationBilling(client, organization, billing) {
  const set = {};
  for (const field of ['legalName', 'addressLine1', 'addressLine2', 'postalCode', 'city', 'country', 'vatId']) {
    if (billing[field] && !organization[field]) {
      set[field] = billing[field];
    }
  }
  if (Object.keys(set).length > 0) {
    await client.request(UPDATE_ORGANIZATION_BILLING, { id: organization.id, set });
  }
}

/**
 * Puts the invoice address (and VAT ID) on the Stripe customer. Stripe
 * snapshots them onto the invoice at finalization, so a later change never
 * rewrites an issued document.
 *
 * @returns {Promise<string|null>} messageKey on a rejected VAT ID, else null
 */
export async function applyCustomerBilling(stripe, customerId, billing, logger) {
  await stripe.customers.update(customerId, {
    name: billing.legalName,
    address: {
      line1: billing.addressLine1,
      line2: billing.addressLine2 || '',
      postal_code: billing.postalCode,
      city: billing.city,
      country: billing.country,
    },
    preferred_locales: ['de'],
  });

  if (!billing.vatId) return null;
  const existing = await stripe.customers.listTaxIds(customerId, { limit: 100 });
  if (existing.data.some((taxId) => taxId.value === billing.vatId)) return null;
  try {
    await stripe.customers.createTaxId(customerId, { type: 'eu_vat', value: billing.vatId });
  } catch (error) {
    logger.warn('Stripe rejected the VAT ID', { error: error.message });
    return 'INVALID_VAT_ID';
  }
  return null;
}

/**
 * Creates, records and finalizes the bank transfer invoice.
 *
 * Order matters: the Invoice row is inserted before finalization so the
 * invoice.finalized webhook (and the sendPendingJobPostingMails sweep) find it
 * by stripeInvoiceId. `publish` runs between creating the draft and inserting
 * the row, so a failure up to and including it deletes the draft. A failure
 * after it carries the draft id as `error.stripeInvoiceId` for the caller's
 * admin notice.
 *
 * @returns {Promise<Object>} the finalized Stripe invoice and our row id
 */
export async function issueBankTransferInvoice({
  stripe,
  client,
  logger,
  customerId,
  lineItem,
  currency,
  footer,
  description,
  reference,
  metadata,
  invoiceRow,
  publish,
}) {
  const draft = await stripe.invoices.create(
    buildBankTransferInvoiceParams({ customerId, currency, footer, description, reference, metadata })
  );

  let totals;
  let publishResult;
  try {
    await stripe.invoiceItems.create(buildInvoiceItemParams({ customerId, invoiceId: draft.id, lineItem }));
    totals = await stripe.invoices.retrieve(draft.id);
    publishResult = await publish();
  } catch (error) {
    await stripe.invoices.del(draft.id).catch((deleteError) =>
      logger.warn('Could not delete the draft invoice', { invoiceId: draft.id, error: deleteError.message })
    );
    throw error;
  }

  try {
    return await recordAndFinalize({ stripe, client, draft, totals, currency, reference, invoiceRow, publishResult });
  } catch (error) {
    error.stripeInvoiceId = draft.id;
    throw error;
  }
}

async function recordAndFinalize({ stripe, client, draft, totals, currency, reference, invoiceRow, publishResult }) {
  const grossTotal = totals.total;
  const netTotal = totals.subtotal;
  const { insert_Invoice_one: row } = await client.request(INSERT_JOB_INVOICE, {
    ...invoiceRow,
    invoiceNumber: `STUJO-${draft.id}`,
    netTotal,
    vatTotal: grossTotal - netTotal,
    grossTotal,
    currency: currency.toUpperCase(),
    stripeInvoiceId: draft.id,
    notes: reference ? `Bestellnummer: ${reference}` : null,
  });

  const finalized = await stripe.invoices.finalizeInvoice(draft.id, { auto_advance: false });
  await client.request(BACKFILL_INVOICE_DOCUMENT, {
    id: row.id,
    stripeInvoiceNumber: finalized.number ?? null,
    stripeHostedInvoiceUrl: finalized.hosted_invoice_url ?? null,
    stripeInvoicePdfUrl: finalized.invoice_pdf ?? null,
  });

  return { invoice: finalized, invoiceRowId: row.id, netTotal, grossTotal, publishResult };
}
