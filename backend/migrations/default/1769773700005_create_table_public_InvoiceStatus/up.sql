-- Create InvoiceStatus enum table for invoice lifecycle states
CREATE TABLE "public"."InvoiceStatus" (
  "value" text PRIMARY KEY,
  "comment" text
);

COMMENT ON TABLE "public"."InvoiceStatus" IS 'Invoice lifecycle status values. Synced from Stripe webhooks';

INSERT INTO "public"."InvoiceStatus" ("value", "comment") VALUES
  ('DRAFT', 'Invoice is a draft, not yet issued'),
  ('ISSUED', 'Invoice has been issued and sent'),
  ('PAID', 'Invoice has been paid'),
  ('CANCELLED', 'Invoice was cancelled'),
  ('REFUNDED', 'Payment was refunded'),
  ('OVERDUE', 'Invoice is past due date');
