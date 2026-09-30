import { InvoiceStatus_enum } from '../__generated__/globalTypes';
import { canRetryPayment, getPaymentStatusFromInvoices, hasPaidInvoice } from './invoicePaymentStatus';

const invoices = (...statuses: InvoiceStatus_enum[]) => statuses.map((status) => ({ status }));

describe('hasPaidInvoice', () => {
  it('sees a payment that an older invoice carries', () => {
    // The regression this exists for: a retry after a successful payment opens a
    // second checkout session, so the newest invoice is ISSUED while the money
    // was already taken. Reading only the newest one called that enrollment
    // unpaid and offered a self-service exit it must not get.
    expect(hasPaidInvoice(invoices(InvoiceStatus_enum.ISSUED, InvoiceStatus_enum.PAID))).toBe(true);
  });

  it('sees a payment on the newest invoice', () => {
    expect(hasPaidInvoice(invoices(InvoiceStatus_enum.PAID, InvoiceStatus_enum.ISSUED))).toBe(true);
  });

  it('reports no payment when none of the invoices is paid', () => {
    expect(hasPaidInvoice(invoices(InvoiceStatus_enum.ISSUED, InvoiceStatus_enum.CANCELLED))).toBe(false);
  });

  it('treats a missing invoice list as unpaid', () => {
    expect(hasPaidInvoice([])).toBe(false);
    expect(hasPaidInvoice(null)).toBe(false);
    expect(hasPaidInvoice(undefined)).toBe(false);
  });
});

describe('getPaymentStatusFromInvoices', () => {
  it('stays on the newest invoice, which is what a retry prompt turns on', () => {
    // Deliberately not the same question as hasPaidInvoice: what to show and
    // whether to offer a retry are about the most recent attempt.
    expect(getPaymentStatusFromInvoices(invoices(InvoiceStatus_enum.ISSUED, InvoiceStatus_enum.PAID))).toBe('PENDING');
    expect(canRetryPayment(invoices(InvoiceStatus_enum.ISSUED, InvoiceStatus_enum.PAID))).toBe(true);
  });
});
