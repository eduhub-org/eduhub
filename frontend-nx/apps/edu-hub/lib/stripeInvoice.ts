import { randomUUID } from 'node:crypto';
import { GraphQLClient, gql } from 'graphql-request';
import type Stripe from 'stripe';

/**
 * Shared helpers for the Stripe-generated invoice document, used by both the
 * course checkout path (pages/api/webhooks/stripe.ts) and the StuJo job
 * posting path (lib/stripeJobPosting.ts).
 */

/**
 * Generates a unique invoice number for Stripe Checkout payments.
 * Uses session/payment intent ID as unique suffix when available.
 * Falls back to crypto.randomUUID() when both are absent to avoid collisions.
 *
 * This is our own record key, not the number printed on the Stripe document --
 * that one is `ResolvedStripeInvoice.number`, stored separately in
 * `Invoice.stripeInvoiceNumber`.
 */
export function generateInvoiceNumber(
  prefix: string,
  sessionId?: string | null,
  paymentIntentId?: string | null
): string {
  const suffix = sessionId || paymentIntentId || `web-${randomUUID()}`;
  return `${prefix}-${suffix}`;
}

export type ResolvedStripeInvoice = {
  id: string | null;
  /** Stripe's sequential document number, e.g. VGD1VIPO-0001. Null while draft. */
  number: string | null;
  hostedUrl: string | null;
  pdfUrl: string | null;
  status: Stripe.Invoice.Status | null;
};

const EMPTY_INVOICE: ResolvedStripeInvoice = {
  id: null,
  number: null,
  hostedUrl: null,
  pdfUrl: null,
  status: null,
};

/**
 * Resolves the Stripe-generated invoice document (invoice_creation) so the
 * Invoice row carries the legally required document references.
 *
 * Reads once and returns whatever exists right now. With `invoice_creation`
 * Stripe finalizes asynchronously, so `number` and `pdfUrl` may still be null;
 * callers must handle that rather than waiting here. Polling inside a webhook
 * would burn the ~20s delivery budget against timing Stripe does not promise --
 * finalization can lag by an hour, or up to 72 hours if deliveries are failing.
 * The `invoice.finalized` event is the supported signal instead.
 *
 * Never throws: a Stripe outage must not turn a completed payment into a failed
 * webhook. On error it falls back to the bare reference.
 */
export async function resolveStripeInvoice(
  stripe: Stripe,
  invoiceRef: string | Stripe.Invoice | null | undefined
): Promise<ResolvedStripeInvoice> {
  if (!invoiceRef) {
    return { ...EMPTY_INVOICE };
  }

  try {
    const invoice =
      typeof invoiceRef === 'string' ? await stripe.invoices.retrieve(invoiceRef) : invoiceRef;

    return {
      id: invoice.id ?? null,
      number: invoice.number ?? null,
      hostedUrl: invoice.hosted_invoice_url ?? null,
      pdfUrl: invoice.invoice_pdf ?? null,
      status: invoice.status ?? null,
    };
  } catch (err) {
    console.warn('Could not resolve Stripe invoice document:', err);
    return {
      ...EMPTY_INVOICE,
      id: typeof invoiceRef === 'string' ? invoiceRef : null,
    };
  }
}

const GET_UNLINKED_CHECKOUT_INVOICE = gql`
  query GetUnlinkedCheckoutInvoice($where: Invoice_bool_exp!, $stripeInvoiceId: String!) {
    Invoice(where: $where, order_by: { created_at: asc }, limit: 1) {
      id
    }
    linked: Invoice(where: { stripeInvoiceId: { _eq: $stripeInvoiceId } }, limit: 1) {
      id
    }
  }
`;

const LINK_STRIPE_INVOICE = gql`
  mutation LinkStripeInvoice($id: Int!, $stripeInvoiceId: String!) {
    update_Invoice(
      where: { id: { _eq: $id }, stripeInvoiceId: { _is_null: true } }
      _set: { stripeInvoiceId: $stripeInvoiceId }
    ) {
      affected_rows
    }
  }
`;

/**
 * Links a Checkout invoice document to the Invoice row the webhook recorded
 * at checkout.session.completed.
 *
 * For a direct debit Stripe only creates the invoice once the money is
 * collected, days after the session completed, so the row was written without
 * a stripeInvoiceId and invoice.finalized cannot find it by id. The document
 * is matched instead on the invoice_creation metadata the checkout set
 * (jobPostingId or enrollmentId) and on its amount; of several candidates the
 * oldest wins, since Stripe raises the invoices in the order it collects.
 * A cancelled row is a failed debit and never gets the document. Losing the
 * conditional update to a concurrent delivery moves on to the next candidate,
 * unless that delivery linked this very invoice.
 *
 * @returns true when a row was linked
 */
export async function linkCheckoutInvoice(
  client: GraphQLClient,
  invoiceDoc: Stripe.Invoice
): Promise<boolean> {
  if (!invoiceDoc.id) return false;
  const jobPostingId = Number.parseInt(invoiceDoc.metadata?.jobPostingId ?? '', 10);
  const enrollmentId = Number.parseInt(invoiceDoc.metadata?.enrollmentId ?? '', 10);
  let owner: Record<string, { _eq: number }>;
  if (Number.isInteger(jobPostingId)) {
    owner = { jobPostingId: { _eq: jobPostingId } };
  } else if (Number.isInteger(enrollmentId)) {
    owner = { courseEnrollmentId: { _eq: enrollmentId } };
  } else {
    return false;
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { Invoice: rows, linked } = await client.request<{
      Invoice: Array<{ id: number }>;
      linked: Array<{ id: number }>;
    }>(GET_UNLINKED_CHECKOUT_INVOICE, {
      stripeInvoiceId: invoiceDoc.id,
      where: {
        ...owner,
        stripeInvoiceId: { _is_null: true },
        stripeCheckoutSessionId: { _is_null: false },
        status: { _neq: 'CANCELLED' },
        grossTotal: { _eq: invoiceDoc.total },
      },
    });
    if (linked.length > 0) return true;
    if (rows.length === 0) return false;

    const { update_Invoice } = await client.request<{ update_Invoice: { affected_rows: number } }>(
      LINK_STRIPE_INVOICE,
      { id: rows[0].id, stripeInvoiceId: invoiceDoc.id }
    );
    if (update_Invoice.affected_rows > 0) return true;
  }
  return false;
}
