import { randomUUID } from 'node:crypto';
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
