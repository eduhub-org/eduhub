import { jest } from '@jest/globals';

import {
  INVOICE_DAYS_UNTIL_DUE,
  applyCustomerBilling,
  buildBankTransferInvoiceParams,
  buildInvoiceItemParams,
  fillOrganizationBilling,
  issueBankTransferInvoice,
  normalizeBillingInput,
} from '../publishJobPosting/invoicePayment.js';

const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

const completeBilling = {
  legalName: ' Max-Planck-Institut für Evolutionsbiologie ',
  addressLine1: 'August-Thienemann-Str. 2',
  postalCode: '24306',
  city: 'Plön',
  country: 'de',
};

describe('normalizeBillingInput', () => {
  it('trims fields and upper-cases the country', () => {
    const { billing, error } = normalizeBillingInput(completeBilling);

    expect(error).toBeNull();
    expect(billing.legalName).toBe('Max-Planck-Institut für Evolutionsbiologie');
    expect(billing.country).toBe('DE');
    expect(billing.vatId).toBeNull();
    expect(billing.reference).toBeNull();
  });

  it('normalizes the VAT ID', () => {
    const { billing } = normalizeBillingInput({ ...completeBilling, vatId: 'de 123 456 789' });

    expect(billing.vatId).toBe('DE123456789');
  });

  it.each(['legalName', 'addressLine1', 'postalCode', 'city', 'country'])(
    'rejects a missing %s',
    (field) => {
      expect(normalizeBillingInput({ ...completeBilling, [field]: '  ' }).error).toBe('BILLING_INCOMPLETE');
    }
  );

  it('rejects a country that is not an ISO code', () => {
    expect(normalizeBillingInput({ ...completeBilling, country: 'Germany' }).error).toBe('BILLING_INCOMPLETE');
  });

  it('rejects a reference longer than Stripe accepts', () => {
    expect(normalizeBillingInput({ ...completeBilling, reference: 'x'.repeat(141) }).error).toBe(
      'BILLING_FIELD_TOO_LONG'
    );
  });

  it('requires billing data at all', () => {
    expect(normalizeBillingInput(null).error).toBe('BILLING_REQUIRED');
  });
});

describe('buildBankTransferInvoiceParams', () => {
  it('issues a send_invoice invoice paid by EU bank transfer', () => {
    const params = buildBankTransferInvoiceParams({
      customerId: 'cus_1',
      currency: 'eur',
      metadata: { jobPostingId: '7', source: 'stujo' },
    });

    expect(params).toMatchObject({
      customer: 'cus_1',
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
      metadata: { jobPostingId: '7', source: 'stujo', paymentMethod: 'INVOICE' },
    });
    expect(params.custom_fields).toBeUndefined();
  });

  it('prints the order reference as a custom field', () => {
    const params = buildBankTransferInvoiceParams({ customerId: 'cus_1', currency: 'eur', reference: 'B-4711' });

    expect(params.custom_fields).toEqual([{ name: 'Bestellnummer', value: 'B-4711' }]);
  });
});

describe('buildInvoiceItemParams', () => {
  it('keeps a bootstrapped price', () => {
    expect(
      buildInvoiceItemParams({
        customerId: 'cus_1',
        invoiceId: 'in_1',
        lineItem: { price: 'price_1', quantity: 1, tax_rates: ['txr_1'] },
      })
    ).toEqual({ customer: 'cus_1', invoice: 'in_1', pricing: { price: 'price_1' }, quantity: 1, tax_rates: ['txr_1'] });
  });

  it('turns the dynamic fallback into a plain amount', () => {
    expect(
      buildInvoiceItemParams({
        customerId: 'cus_1',
        invoiceId: 'in_1',
        lineItem: {
          price_data: { currency: 'eur', product_data: { name: 'StuJo Stellenanzeige: INTERNSHIP' }, unit_amount: 5000 },
          quantity: 1,
        },
      })
    ).toEqual({
      customer: 'cus_1',
      invoice: 'in_1',
      amount: 5000,
      currency: 'eur',
      description: 'StuJo Stellenanzeige: INTERNSHIP',
    });
  });
});

describe('fillOrganizationBilling', () => {
  it('only fills columns that are still empty', async () => {
    const client = { request: jest.fn().mockResolvedValue({}) };
    const { billing } = normalizeBillingInput({ ...completeBilling, vatId: 'DE123456789' });

    await fillOrganizationBilling(client, { id: 3, city: 'Kiel', legalName: null }, billing);

    const { set } = client.request.mock.calls[0][1];
    expect(set.city).toBeUndefined();
    expect(set.legalName).toBe('Max-Planck-Institut für Evolutionsbiologie');
    expect(set.vatId).toBe('DE123456789');
  });

  it('writes nothing when everything is set', async () => {
    const client = { request: jest.fn() };
    const { billing } = normalizeBillingInput(completeBilling);

    await fillOrganizationBilling(client, { id: 3, ...billing }, billing);

    expect(client.request).not.toHaveBeenCalled();
  });
});

describe('applyCustomerBilling', () => {
  const makeStripe = (existingTaxIds = []) => ({
    customers: {
      update: jest.fn().mockResolvedValue({}),
      listTaxIds: jest.fn().mockResolvedValue({ data: existingTaxIds }),
      createTaxId: jest.fn().mockResolvedValue({}),
    },
  });

  it('puts the address on the customer', async () => {
    const stripe = makeStripe();
    const { billing } = normalizeBillingInput(completeBilling);

    expect(await applyCustomerBilling(stripe, 'cus_1', billing, logger)).toBeNull();
    expect(stripe.customers.update).toHaveBeenCalledWith(
      'cus_1',
      expect.objectContaining({
        name: 'Max-Planck-Institut für Evolutionsbiologie',
        address: expect.objectContaining({ postal_code: '24306', country: 'DE' }),
      })
    );
    expect(stripe.customers.createTaxId).not.toHaveBeenCalled();
  });

  it('adds a VAT ID once', async () => {
    const stripe = makeStripe([{ value: 'DE123456789' }]);
    const { billing } = normalizeBillingInput({ ...completeBilling, vatId: 'DE123456789' });

    await applyCustomerBilling(stripe, 'cus_1', billing, logger);

    expect(stripe.customers.createTaxId).not.toHaveBeenCalled();
  });

  it('reports a VAT ID Stripe rejects', async () => {
    const stripe = makeStripe();
    stripe.customers.createTaxId.mockRejectedValue(new Error('Invalid value for eu_vat'));
    const { billing } = normalizeBillingInput({ ...completeBilling, vatId: 'XX1' });

    expect(await applyCustomerBilling(stripe, 'cus_1', billing, logger)).toBe('INVALID_VAT_ID');
  });
});

describe('issueBankTransferInvoice', () => {
  const lineItem = { price: 'price_1', quantity: 1, tax_rates: ['txr_1'] };

  const makeStripe = () => ({
    invoices: {
      create: jest.fn().mockResolvedValue({ id: 'in_1' }),
      retrieve: jest.fn().mockResolvedValue({ id: 'in_1', subtotal: 5000, total: 5950 }),
      finalizeInvoice: jest.fn().mockResolvedValue({
        id: 'in_1',
        number: 'ABC-0001',
        hosted_invoice_url: 'https://invoice.stripe.com/i/1',
        invoice_pdf: 'https://pay.stripe.com/invoice/1/pdf',
      }),
      del: jest.fn().mockResolvedValue({}),
    },
    invoiceItems: { create: jest.fn().mockResolvedValue({}) },
  });

  const run = (stripe, client, publish) =>
    issueBankTransferInvoice({
      stripe,
      client,
      logger,
      customerId: 'cus_1',
      lineItem,
      currency: 'eur',
      footer: null,
      description: 'StuJo',
      reference: 'B-4711',
      metadata: { jobPostingId: '7', source: 'stujo' },
      invoiceRow: { organizationId: 1, userId: 'u-1', jobPostingId: 7 },
      publish,
    });

  it('publishes, records the row before finalizing, then backfills the document', async () => {
    const order = [];
    const stripe = makeStripe();
    stripe.invoices.finalizeInvoice.mockImplementation(async () => {
      order.push('finalize');
      return { id: 'in_1', number: 'ABC-0001', invoice_pdf: 'pdf', hosted_invoice_url: 'url' };
    });
    const client = {
      request: jest.fn().mockImplementation(async (_doc, vars) => {
        if (vars.invoiceNumber) {
          order.push('insert');
          return { insert_Invoice_one: { id: 42 } };
        }
        order.push('backfill');
        return {};
      }),
    };
    const publish = jest.fn().mockImplementation(async () => {
      order.push('publish');
      return {};
    });

    const result = await run(stripe, client, publish);

    expect(order).toEqual(['publish', 'insert', 'finalize', 'backfill']);
    expect(result).toMatchObject({ invoiceRowId: 42, netTotal: 5000, grossTotal: 5950 });
    const insertVars = client.request.mock.calls[0][1];
    expect(insertVars).toMatchObject({
      invoiceNumber: 'STUJO-in_1',
      netTotal: 5000,
      vatTotal: 950,
      grossTotal: 5950,
      currency: 'EUR',
      stripeInvoiceId: 'in_1',
      notes: 'Bestellnummer: B-4711',
    });
    expect(stripe.invoices.finalizeInvoice).toHaveBeenCalledWith('in_1', { auto_advance: false });
  });

  it('deletes the draft and does not publish when the line item fails', async () => {
    const stripe = makeStripe();
    stripe.invoiceItems.create.mockRejectedValue(new Error('boom'));
    const client = { request: jest.fn() };
    const publish = jest.fn();

    await expect(run(stripe, client, publish)).rejects.toThrow('boom');

    expect(stripe.invoices.del).toHaveBeenCalledWith('in_1');
    expect(publish).not.toHaveBeenCalled();
    expect(client.request).not.toHaveBeenCalled();
  });
});
