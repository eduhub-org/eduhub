import type Stripe from 'stripe';

import { refreshSession } from '../stripe';

/**
 * refreshSession re-reads a Checkout Session so the recorded amounts come from
 * the SDK's API version rather than the version pinned to the webhook endpoint.
 * The behaviour that matters is the fallback: a failed read must not turn a
 * completed payment into a failed webhook.
 */
describe('refreshSession', () => {
  const delivered = {
    id: 'cs_test_delivered',
    amount_total: 0,
    amount_subtotal: 0,
    metadata: { jobPostingId: '42' },
  } as unknown as Stripe.Checkout.Session;

  const fresh = {
    id: 'cs_test_delivered',
    amount_total: 5950,
    amount_subtotal: 5000,
    total_details: { amount_tax: 950 },
    metadata: { jobPostingId: '42' },
  } as unknown as Stripe.Checkout.Session;

  const stripeWith = (retrieve: jest.Mock) =>
    ({ checkout: { sessions: { retrieve } } } as unknown as Stripe);

  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('returns the freshly read session, not the delivered payload', async () => {
    const retrieve = jest.fn().mockResolvedValue(fresh);

    const result = await refreshSession(stripeWith(retrieve), delivered);

    expect(retrieve).toHaveBeenCalledWith('cs_test_delivered');
    expect(result.amount_total).toBe(5950);
    expect(result.amount_subtotal).toBe(5000);
    expect(result.total_details?.amount_tax).toBe(950);
  });

  it('falls back to the delivered payload when the read fails', async () => {
    const retrieve = jest.fn().mockRejectedValue(new Error('Stripe unreachable'));

    const result = await refreshSession(stripeWith(retrieve), delivered);

    expect(result).toBe(delivered);
    expect(warn).toHaveBeenCalled();
  });

  it('does not throw when the read fails, so the webhook still completes', async () => {
    const retrieve = jest.fn().mockRejectedValue(new Error('boom'));

    await expect(refreshSession(stripeWith(retrieve), delivered)).resolves.toBeDefined();
  });
});
