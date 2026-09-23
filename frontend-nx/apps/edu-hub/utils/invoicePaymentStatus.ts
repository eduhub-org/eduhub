import { InvoiceStatus_enum } from '../__generated__/globalTypes';

/**
 * Derives a display-friendly payment status from an enrollment's Invoices.
 * Used when CourseEnrollment no longer has paymentStatus (replaced by Invoice table).
 *
 * @param invoices - Array of Invoice objects (typically latest first)
 * @returns 'NONE' | 'PENDING' | 'COMPLETED' | 'FAILED'
 */
export function getPaymentStatusFromInvoices(
  invoices: Array<{ status: InvoiceStatus_enum }> | null | undefined
): 'NONE' | 'PENDING' | 'COMPLETED' | 'FAILED' {
  if (!invoices || invoices.length === 0) {
    return 'NONE';
  }
  const latestInvoice = invoices[0];
  switch (latestInvoice.status) {
    case InvoiceStatus_enum.PAID:
      return 'COMPLETED';
    case InvoiceStatus_enum.CANCELLED:
    case InvoiceStatus_enum.REFUNDED:
      return 'FAILED';
    case InvoiceStatus_enum.DRAFT:
    case InvoiceStatus_enum.ISSUED:
    case InvoiceStatus_enum.OVERDUE:
      return 'PENDING';
    default:
      return 'NONE';
  }
}

/**
 * Whether money has actually been taken for this enrollment.
 *
 * Deliberately looks at every invoice rather than the latest one:
 * `createStripeCheckout` opens a fresh checkout session each time it is called
 * and the webhook inserts one invoice per session, with nothing making
 * `courseEnrollmentId` unique. A retry after a successful payment therefore
 * leaves a newer non-PAID invoice in front of the PAID one, and a
 * latest-invoice-only reading would call a paid enrollment unpaid.
 *
 * `getPaymentStatusFromInvoices` stays latest-only on purpose - what to show and
 * whether a retry is possible are questions about the most recent attempt.
 */
export function hasPaidInvoice(
  invoices: Array<{ status: InvoiceStatus_enum }> | null | undefined
): boolean {
  return (invoices ?? []).some((invoice) => invoice.status === InvoiceStatus_enum.PAID);
}

/**
 * Checks if the user can retry payment (pending or failed invoice).
 */
export function canRetryPayment(
  invoices: Array<{ status: InvoiceStatus_enum }> | null | undefined
): boolean {
  const status = getPaymentStatusFromInvoices(invoices);
  return status === 'PENDING' || status === 'FAILED';
}
