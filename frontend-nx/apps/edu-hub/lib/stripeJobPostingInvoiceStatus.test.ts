/**
 * @jest-environment node
 */
import type { GraphQLClient } from 'graphql-request';
import type Stripe from 'stripe';

import { handleJobPostingInvoiceStatusEvent } from './stripeJobPosting';

const bankTransferInvoice = (overrides: Partial<Stripe.Invoice> = {}) =>
  ({
    id: 'in_1',
    number: 'ABC-0001',
    metadata: { source: 'stujo', paymentMethod: 'INVOICE', jobPostingId: '7' },
    ...overrides,
  } as unknown as Stripe.Invoice);

const makeClient = (row: Record<string, unknown> | null) => {
  const calls: Array<{ query: string; variables: Record<string, unknown> }> = [];
  const request = jest.fn(async (query: unknown, variables: Record<string, unknown>) => {
    const text = String((query as { loc?: { source: { body: string } } })?.loc?.source.body ?? query);
    calls.push({ query: text, variables });
    if (text.includes('GetJobInvoiceByStripeId')) return { Invoice: row ? [row] : [] };
    if (text.includes('GetJobPostingForWebhook')) {
      return {
        JobPosting_by_pk: {
          id: 7,
          title: 'Praktikum Gebäudemanagement',
          type: 'INTERNSHIP',
          status: 'PUBLISHED',
          expiresAt: null,
          organizationId: 3,
          termsAcceptedAt: null,
          ContactUser: { email: 'hr@example.org' },
          Organization: { name: 'MPI' },
        },
        JobPostingPrice: [],
      };
    }
    if (text.includes('GetJobMailTemplateWebhook')) {
      return { MailTemplate: [{ subject: 's', content: 'c', from: null, bcc: null }] };
    }
    return {};
  });
  return { client: { request } as unknown as GraphQLClient, calls };
};

const statusUpdates = (calls: Array<{ query: string; variables: Record<string, unknown> }>) =>
  calls.filter((call) => call.query.includes('UpdateJobInvoiceStatus')).map((call) => call.variables);

const row = (status: string) => ({
  id: 42,
  jobPostingId: 7,
  status,
  grossTotal: 5950,
  currency: 'EUR',
});

describe('handleJobPostingInvoiceStatusEvent', () => {
  const originalAdmin = process.env.STUJO_ADMIN_EMAIL;
  afterEach(() => {
    process.env.STUJO_ADMIN_EMAIL = originalAdmin;
  });

  it('marks a received bank transfer as paid', async () => {
    const { client, calls } = makeClient(row('ISSUED'));

    await handleJobPostingInvoiceStatusEvent(client, 'invoice.paid', bankTransferInvoice());

    expect(statusUpdates(calls)).toEqual([{ id: 42, status: 'PAID' }]);
  });

  it('is idempotent for a re-delivered payment', async () => {
    const { client, calls } = makeClient(row('PAID'));

    await handleJobPostingInvoiceStatusEvent(client, 'invoice.paid', bankTransferInvoice());

    expect(statusUpdates(calls)).toEqual([]);
  });

  it('never moves a paid invoice back to overdue', async () => {
    const { client, calls } = makeClient(row('PAID'));

    await handleJobPostingInvoiceStatusEvent(client, 'invoice.overdue', bankTransferInvoice());

    expect(statusUpdates(calls)).toEqual([]);
  });

  it('flags an overdue invoice and notifies the StuJo admin', async () => {
    process.env.STUJO_ADMIN_EMAIL = 'admin@example.org';
    const { client, calls } = makeClient(row('ISSUED'));

    await handleJobPostingInvoiceStatusEvent(client, 'invoice.overdue', bankTransferInvoice());

    expect(statusUpdates(calls)).toEqual([{ id: 42, status: 'OVERDUE' }]);
    const mail = calls.find((call) => call.query.includes('InsertJobMailLogWebhook'));
    expect(mail?.variables).toMatchObject({ to: 'admin@example.org' });
  });

  it('cancels a voided invoice', async () => {
    const { client, calls } = makeClient(row('OVERDUE'));

    await handleJobPostingInvoiceStatusEvent(client, 'invoice.voided', bankTransferInvoice());

    expect(statusUpdates(calls)).toEqual([{ id: 42, status: 'CANCELLED' }]);
  });

  it('ignores Checkout invoices and course invoices', async () => {
    const { client, calls } = makeClient(row('ISSUED'));

    await handleJobPostingInvoiceStatusEvent(
      client,
      'invoice.paid',
      bankTransferInvoice({ metadata: { source: 'stujo' } } as Partial<Stripe.Invoice>)
    );
    await handleJobPostingInvoiceStatusEvent(
      client,
      'invoice.paid',
      bankTransferInvoice({ metadata: {} } as Partial<Stripe.Invoice>)
    );

    expect(calls).toEqual([]);
  });
});
