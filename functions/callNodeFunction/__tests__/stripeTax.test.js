import { buildPaymentMethodConfig } from '../lib/stripeTax.js';

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
