import {
  buildPaymentMethodConfig,
  buildCoursePaymentDescription,
  buildJobPostingPaymentDescription,
} from '../lib/stripeTax.js';

describe('buildPaymentMethodConfig', () => {
  it('offers card and SEPA debit, and lets Stripe create the customer when there is no email', () => {
    expect(buildPaymentMethodConfig()).toEqual({
      payment_method_types: ['card', 'sepa_debit'],
      customer_creation: 'always',
    });
  });

  it('attaches an existing customer instead of creating a second one', () => {
    expect(buildPaymentMethodConfig('cus_123')).toEqual({
      customer: 'cus_123',
      payment_method_types: ['card', 'sepa_debit'],
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
