/**
 * @jest-environment node
 */
import type { GraphQLClient } from 'graphql-request';
import type Stripe from 'stripe';

import { handleJobPostingInvoiceFinalized } from './stripeJobPosting';

// A direct debit's Checkout invoice: raised by Stripe once the money is
// collected, days after our Invoice row was written without its id.
const collectedInvoice = (metadata: Record<string, string>) =>
  ({
    id: 'in_debit',
    number: 'CBB-0042',
    status: 'paid',
    total: 5950,
    hosted_invoice_url: 'https://invoice.stripe.com/i/x',
    invoice_pdf: 'https://pay.stripe.com/invoice/x/pdf',
    status_transitions: { finalized_at: 1792058400 },
    metadata,
  } as unknown as Stripe.Invoice);

const unlinkedRow = {
  id: 42,
  jobPostingId: 7,
  invoiceNumber: 'STUJO-cs_1',
  invoiceDate: '2026-10-13',
  netTotal: 5000,
  vatTotal: 950,
  grossTotal: 5950,
  currency: 'EUR',
  status: 'PAID',
};

type Call = { query: string; variables: Record<string, unknown> };

const makeClient = ({
  unlinked = [unlinkedRow] as Array<typeof unlinkedRow>,
  queuedMails = {} as Record<string, Array<{ id: number; attachments: unknown[] | null }>>,
  lostUpdates = 0,
  alreadyLinked = false,
} = {}) => {
  const calls: Call[] = [];
  let linked = false;
  let candidates = unlinked;
  const request = jest.fn(async (query: unknown, variables: Record<string, unknown>) => {
    const text = String((query as { loc?: { source: { body: string } } })?.loc?.source.body ?? query);
    calls.push({ query: text, variables });
    if (text.includes('GetJobInvoiceByStripeId')) return { Invoice: linked ? unlinked.slice(0, 1) : [] };
    if (text.includes('GetUnlinkedCheckoutInvoice')) {
      return {
        Invoice: candidates.slice(0, 1).map(({ id }) => ({ id })),
        linked: alreadyLinked ? [{ id: 41 }] : [],
      };
    }
    if (text.includes('LinkStripeInvoice')) {
      if (lostUpdates > 0) {
        // A concurrent delivery linked this row to another invoice first.
        lostUpdates -= 1;
        candidates = candidates.slice(1);
        return { update_Invoice: { affected_rows: 0 } };
      }
      linked = true;
      return { update_Invoice: { affected_rows: 1 } };
    }
    if (text.includes('GetQueuedJobPostingMail')) {
      const type = (variables.contains as { type: string }).type;
      return { MailLog: queuedMails[type] ?? [] };
    }
    if (text.includes('GetJobPostingForWebhook')) {
      return {
        JobPosting_by_pk: {
          id: 7,
          title: 'Werkstudent Marketing',
          type: 'WORKING_STUDENT',
          status: 'PUBLISHED',
          expiresAt: '2026-12-08T00:00:00Z',
          organizationId: 3,
          termsAcceptedAt: null,
          ContactUser: { email: 'auftrag@example.org' },
          Organization: { name: 'Personalcom' },
        },
        JobPostingPrice: [],
      };
    }
    if (text.includes('GetJobMailTemplateWebhook')) {
      return { MailTemplate: [{ subject: 'Rechnung [JobPosting:Title]', content: '[Invoice:Number]', from: null, bcc: null }] };
    }
    return {};
  });
  return { client: { request } as unknown as GraphQLClient, calls };
};

const queued = (calls: Call[]) =>
  calls.filter((call) => call.query.includes('InsertJobMailLogWebhook')).map((call) => call.variables);

describe('handleJobPostingInvoiceFinalized for a collected direct debit', () => {
  it('links the unlinked row by metadata and amount, then backfills the document', async () => {
    const { client, calls } = makeClient();
    await handleJobPostingInvoiceFinalized(client, collectedInvoice({ jobPostingId: '7', source: 'stujo' }));

    const lookup = calls.find((call) => call.query.includes('GetUnlinkedCheckoutInvoice'));
    expect(lookup?.variables.where).toEqual({
      jobPostingId: { _eq: 7 },
      stripeInvoiceId: { _is_null: true },
      stripeCheckoutSessionId: { _is_null: false },
      status: { _neq: 'CANCELLED' },
      grossTotal: { _eq: 5950 },
    });
    expect(calls.find((call) => call.query.includes('LinkStripeInvoice'))?.variables).toEqual({
      id: 42,
      stripeInvoiceId: 'in_debit',
    });
    expect(calls.find((call) => call.query.includes('BackfillJobInvoiceDocument'))?.variables).toMatchObject({
      id: 42,
      stripeInvoiceNumber: 'CBB-0042',
      stripeInvoicePdfUrl: 'https://pay.stripe.com/invoice/x/pdf',
    });
  });

  it('moves on to the next candidate when a concurrent delivery took the row', async () => {
    const { client, calls } = makeClient({ unlinked: [{ ...unlinkedRow, id: 41 }, unlinkedRow], lostUpdates: 1 });
    await handleJobPostingInvoiceFinalized(client, collectedInvoice({ jobPostingId: '7' }));

    const links = calls.filter((call) => call.query.includes('LinkStripeInvoice')).map((call) => call.variables.id);
    expect(links).toEqual([41, 42]);
  });

  it('does not link a second row once this invoice is linked', async () => {
    const { client, calls } = makeClient({ alreadyLinked: true });
    await handleJobPostingInvoiceFinalized(client, collectedInvoice({ jobPostingId: '7' }));
    expect(calls.some((call) => call.query.includes('LinkStripeInvoice'))).toBe(false);
  });

  it('sends the PDF in JOB_POSTING_INVOICE when the confirmation went out without it', async () => {
    const { client, calls } = makeClient({
      queuedMails: { JOB_POSTING_PUBLISHED: [{ id: 1, attachments: null }] },
    });
    await handleJobPostingInvoiceFinalized(client, collectedInvoice({ jobPostingId: '7' }));

    const mails = queued(calls);
    expect(mails).toHaveLength(1);
    expect(mails[0]).toMatchObject({
      to: 'auftrag@example.org',
      subject: 'Rechnung Werkstudent Marketing',
      content: 'CBB-0042',
      metadata: { type: 'JOB_POSTING_INVOICE', jobPostingId: 7 },
      attachments: [
        {
          url: 'https://pay.stripe.com/invoice/x/pdf',
          filename: 'rechnung-CBB-0042.pdf',
          contentType: 'application/pdf',
        },
      ],
    });
  });

  it('sends nothing when the confirmation already carried the PDF', async () => {
    const { client, calls } = makeClient({
      queuedMails: { JOB_POSTING_PUBLISHED: [{ id: 1, attachments: [{ url: 'x' }] }] },
    });
    await handleJobPostingInvoiceFinalized(client, collectedInvoice({ jobPostingId: '7' }));
    expect(queued(calls)).toHaveLength(0);
  });

  it('sends the invoice mail only once', async () => {
    const { client, calls } = makeClient({
      queuedMails: {
        JOB_POSTING_PUBLISHED: [{ id: 1, attachments: null }],
        JOB_POSTING_INVOICE: [{ id: 2, attachments: null }],
      },
    });
    await handleJobPostingInvoiceFinalized(client, collectedInvoice({ jobPostingId: '7' }));
    expect(queued(calls)).toHaveLength(0);
  });

  it('links a course invoice by enrollmentId without mailing', async () => {
    const courseRow = { ...unlinkedRow, jobPostingId: null as unknown as number };
    const { client, calls } = makeClient({ unlinked: [courseRow] });
    await handleJobPostingInvoiceFinalized(client, collectedInvoice({ enrollmentId: '99', courseId: '5' }));

    const lookup = calls.find((call) => call.query.includes('GetUnlinkedCheckoutInvoice'));
    expect(lookup?.variables.where).toMatchObject({ courseEnrollmentId: { _eq: 99 } });
    expect(calls.some((call) => call.query.includes('BackfillJobInvoiceDocument'))).toBe(true);
    expect(queued(calls)).toHaveLength(0);
  });

  it('ignores an invoice without checkout metadata', async () => {
    const { client, calls } = makeClient();
    await handleJobPostingInvoiceFinalized(client, collectedInvoice({}));
    expect(calls.some((call) => call.query.includes('GetUnlinkedCheckoutInvoice'))).toBe(false);
    expect(calls.some((call) => call.query.includes('BackfillJobInvoiceDocument'))).toBe(false);
  });
});
