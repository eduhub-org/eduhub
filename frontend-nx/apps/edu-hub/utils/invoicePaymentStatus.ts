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
 * Checks if the user can retry payment (pending or failed invoice).
 */
export function canRetryPayment(
  invoices: Array<{ status: InvoiceStatus_enum }> | null | undefined
): boolean {
  const status = getPaymentStatusFromInvoices(invoices);
  return status === 'PENDING' || status === 'FAILED';
}
