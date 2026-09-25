-- StuJo "Kauf auf Rechnung": organizations a StuJo admin has approved may pay
-- paid job postings by Stripe invoice (EU bank transfer to a customer-specific
-- virtual IBAN, 30 days) instead of Checkout. Set by admins only.
ALTER TABLE "public"."Organization"
ADD COLUMN "allowInvoicePayment" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "public"."Organization"."allowInvoicePayment" IS 'StuJo: may pay job postings by invoice (bank transfer) instead of Stripe Checkout. Admin-controlled';
