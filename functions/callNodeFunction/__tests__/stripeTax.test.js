import { jest } from '@jest/globals';

import {
  buildPaymentMethodConfig,
  buildCoursePaymentDescription,
  buildCourseSource,
  buildInvoiceCreation,
  buildJobPostingPaymentDescription,
  buildServicePeriodField,
  formatInvoiceDate,
  getOrCreateCustomer,
} from '../lib/stripeTax.js';

describe('buildPaymentMethodConfig', () => {
  it('offers card and SEPA debit, and lets Stripe create the customer when there is no email', () => {
    expect(buildPaymentMethodConfig()).toEqual({
      payment_method_types: ['card', 'sepa_debit'],
      customer_creation: 'always',
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
    });
  });

  it('attaches an existing customer instead of creating a second one', () => {
    expect(buildPaymentMethodConfig('cus_123')).toEqual({
      customer: 'cus_123',
      payment_method_types: ['card', 'sepa_debit'],
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
      customer_update: { name: 'auto', address: 'auto' },
    });
  });

  it.each([[null], ['cus_123']])(
    'never offers bank transfer (%s) — the capability is unactivated and Stripe rejects the whole session',
    (customerId) => {
      const config = buildPaymentMethodConfig(customerId);

      expect(config.payment_method_types).not.toContain('customer_balance');
      expect(config.payment_method_options).toBeUndefined();
    }
  );

  it('returns a fresh array per call so a caller cannot mutate the next session', () => {
    const first = buildPaymentMethodConfig();
    first.payment_method_types.push('klarna');

    expect(buildPaymentMethodConfig().payment_method_types).toEqual(['card', 'sepa_debit']);
  });
});

describe('buildCoursePaymentDescription', () => {
  it('names the app, the selling organization, the title and the program type', () => {
    expect(buildCoursePaymentDescription('COURSES', 'Design Thinking', 'opencampus')).toBe(
      'EduHub opencampus Design Thinking (Kurs)'
    );
  });

  it.each([
    ['EVENTS', 'EduHub opencampus Demo Day (Event)'],
    ['DEGREES', 'EduHub opencampus Demo Day (Degree)'],
  ])('translates the %s program type', (programType, expected) => {
    expect(buildCoursePaymentDescription(programType, 'Demo Day', 'opencampus')).toBe(expected);
  });

  it('falls back to the raw enum for a program type added later', () => {
    expect(buildCoursePaymentDescription('BOOTCAMPS', 'Demo Day', 'opencampus')).toBe(
      'EduHub opencampus Demo Day (BOOTCAMPS)'
    );
  });

  it('drops missing parts instead of printing null', () => {
    expect(buildCoursePaymentDescription(null, 'Design Thinking', null)).toBe(
      'EduHub Design Thinking'
    );
  });

  it('shortens a long title to 120 characters but keeps the program type visible', () => {
    const description = buildCoursePaymentDescription('COURSES', 'x'.repeat(200), 'opencampus');
    expect(description).toBe(`EduHub opencampus ${'x'.repeat(119)}\u2026 (Kurs)`);
  });
});

describe('buildJobPostingPaymentDescription', () => {
  it('uses the same shape as the course description', () => {
    expect(buildJobPostingPaymentDescription('Werkstudent Frontend', 'ACME GmbH')).toBe(
      'StuJo ACME GmbH Werkstudent Frontend (Stellenanzeige)'
    );
  });

  it('stays readable when the posting has no organization name', () => {
    expect(buildJobPostingPaymentDescription('Werkstudent Frontend', null)).toBe(
      'StuJo Werkstudent Frontend (Stellenanzeige)'
    );
  });
});

describe('buildServicePeriodField', () => {
  it('prints a period in German date format', () => {
    expect(buildServicePeriodField('2026-10-01T10:00:00Z', '2026-10-31T10:00:00Z')).toEqual({
      name: 'Leistungszeitraum',
      value: '01.10.2026 \u2013 31.10.2026',
    });
  });

  it('prints a single day as Leistungsdatum', () => {
    expect(buildServicePeriodField('2026-10-01T10:00:00Z')).toEqual({
      name: 'Leistungsdatum',
      value: '01.10.2026',
    });
    expect(buildServicePeriodField('2026-10-01', '2026-10-01')).toEqual({
      name: 'Leistungsdatum',
      value: '01.10.2026',
    });
  });

  it('returns null without a start date', () => {
    expect(buildServicePeriodField(null, '2026-10-31')).toBeNull();
  });

  it('uses German time, not UTC', () => {
    // 23:30 UTC on 30 Sep is already 1 Oct in Berlin (CEST).
    expect(formatInvoiceDate('2026-09-30T23:30:00Z')).toBe('01.10.2026');
  });
});

describe('buildCourseSource', () => {
  it.each([
    ['COURSES', 'courses'],
    ['EVENTS', 'events'],
    ['DEGREES', 'degrees'],
  ])('maps %s to %s', (type, source) => {
    expect(buildCourseSource(type)).toBe(source);
  });

  it.each([[null], ['SOMETHING_NEW']])('falls back to eduhub for %s', (type) => {
    expect(buildCourseSource(type)).toBe('eduhub');
  });
});

describe('buildInvoiceCreation', () => {
  it('stays a bare invoice without options', () => {
    expect(buildInvoiceCreation(null)).toEqual({ enabled: true });
  });

  it('adds custom fields and metadata, skipping missing fields', () => {
    const field = { name: 'Leistungsdatum', value: '01.10.2026' };

    expect(
      buildInvoiceCreation({ invoiceFooterText: 'Footer' }, { customFields: [field, null], metadata: { source: 'courses' } })
    ).toEqual({
      enabled: true,
      invoice_data: { footer: 'Footer', custom_fields: [field], metadata: { source: 'courses' } },
    });
  });
});

describe('getOrCreateCustomer', () => {
  const makeStripe = (existing) => ({
    customers: {
      list: jest.fn().mockResolvedValue({ data: existing }),
      create: jest.fn().mockResolvedValue({ id: 'cus_new' }),
      update: jest.fn().mockResolvedValue({}),
    },
  });

  it('creates a customer with German invoices', async () => {
    const stripe = makeStripe([]);

    expect(await getOrCreateCustomer(stripe, 'a@example.com', 'ACME')).toBe('cus_new');
    expect(stripe.customers.create).toHaveBeenCalledWith({
      email: 'a@example.com',
      name: 'ACME',
      preferred_locales: ['de'],
    });
  });

  it('switches an existing customer without a locale to German', async () => {
    const stripe = makeStripe([{ id: 'cus_1', preferred_locales: [] }]);

    expect(await getOrCreateCustomer(stripe, 'a@example.com')).toBe('cus_1');
    expect(stripe.customers.update).toHaveBeenCalledWith('cus_1', { preferred_locales: ['de'] });
  });

  it('keeps a locale the customer already has', async () => {
    const stripe = makeStripe([{ id: 'cus_1', preferred_locales: ['en'] }]);

    await getOrCreateCustomer(stripe, 'a@example.com');

    expect(stripe.customers.update).not.toHaveBeenCalled();
  });
});
