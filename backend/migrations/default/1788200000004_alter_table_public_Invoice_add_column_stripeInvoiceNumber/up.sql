ALTER TABLE "public"."Invoice" ADD COLUMN "stripeInvoiceNumber" text NULL;

COMMENT ON COLUMN "public"."Invoice"."stripeInvoiceNumber" IS 'Stripe''s sequential invoice document number (e.g. VGD1VIPO-0001) as printed on the invoice PDF. Distinct from "invoiceNumber" (our own internal record key, prefix + checkout session) and from "stripeInvoiceId" (the in_... object reference). Null while the Stripe invoice is still a draft, because Stripe assigns the number on finalization.';
