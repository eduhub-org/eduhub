-- Create lightweight Invoice reference table
-- Stripe Invoicing is the system of record for the full invoice document.
-- This table stores references and key fields for querying, dashboards, and portability.
CREATE TABLE "public"."Invoice" (
  "id" serial PRIMARY KEY,
  "invoiceNumber" text NOT NULL UNIQUE,
  "status" text NOT NULL DEFAULT 'DRAFT',
  "invoiceDate" date NOT NULL DEFAULT CURRENT_DATE,

  -- References (who sold, who bought, what was purchased)
  "organizationId" integer NOT NULL,
  "userId" uuid NOT NULL,
  "courseEnrollmentId" integer NULL,

  -- Totals (in smallest currency unit, e.g. cents) - synced from Stripe
  "netTotal" integer NOT NULL,
  "vatTotal" integer NOT NULL,
  "grossTotal" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'EUR',

  -- Stripe references
  "stripeInvoiceId" text NULL UNIQUE,
  "stripePaymentIntentId" text NULL,
  "stripeCheckoutSessionId" text NULL,
  "stripeHostedInvoiceUrl" text NULL,
  "stripeInvoicePdfUrl" text NULL,

  -- Internal
  "notes" text NULL,

  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization" ("id") ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User" ("id") ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT "Invoice_courseEnrollmentId_fkey" FOREIGN KEY ("courseEnrollmentId") REFERENCES "public"."CourseEnrollment" ("id") ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT "Invoice_status_fkey" FOREIGN KEY ("status") REFERENCES "public"."InvoiceStatus" ("value") ON UPDATE RESTRICT ON DELETE RESTRICT
);

COMMENT ON TABLE "public"."Invoice" IS 'Lightweight invoice reference. Stripe Invoicing is the system of record for the full document';
COMMENT ON COLUMN "public"."Invoice"."invoiceNumber" IS 'Unique invoice number (from Stripe or manually assigned)';
COMMENT ON COLUMN "public"."Invoice"."status" IS 'Invoice lifecycle status. Synced from Stripe webhooks';
COMMENT ON COLUMN "public"."Invoice"."invoiceDate" IS 'Date of invoice issuance';
COMMENT ON COLUMN "public"."Invoice"."organizationId" IS 'Selling organization';
COMMENT ON COLUMN "public"."Invoice"."userId" IS 'Buying user';
COMMENT ON COLUMN "public"."Invoice"."courseEnrollmentId" IS 'Enrollment this invoice covers. B2B buyer org derived via CourseEnrollment.billingOrganizationId';
COMMENT ON COLUMN "public"."Invoice"."netTotal" IS 'Net amount in smallest currency unit (cents)';
COMMENT ON COLUMN "public"."Invoice"."vatTotal" IS 'Total VAT amount in smallest currency unit (cents)';
COMMENT ON COLUMN "public"."Invoice"."grossTotal" IS 'Gross total in smallest currency unit (cents)';
COMMENT ON COLUMN "public"."Invoice"."currency" IS 'ISO 4217 currency code';
COMMENT ON COLUMN "public"."Invoice"."stripeInvoiceId" IS 'Stripe Invoice object ID (e.g. in_1abc...)';
COMMENT ON COLUMN "public"."Invoice"."stripePaymentIntentId" IS 'Stripe PaymentIntent ID';
COMMENT ON COLUMN "public"."Invoice"."stripeCheckoutSessionId" IS 'Stripe Checkout Session ID';
COMMENT ON COLUMN "public"."Invoice"."stripeHostedInvoiceUrl" IS 'Stripe-hosted invoice page URL';
COMMENT ON COLUMN "public"."Invoice"."stripeInvoicePdfUrl" IS 'Stripe-hosted PDF download URL';
COMMENT ON COLUMN "public"."Invoice"."notes" IS 'Internal notes (not shown on invoice)';

-- Indexes for common query patterns
CREATE INDEX "Invoice_organizationId_idx" ON "public"."Invoice" ("organizationId");
CREATE INDEX "Invoice_userId_idx" ON "public"."Invoice" ("userId");
CREATE INDEX "Invoice_courseEnrollmentId_idx" ON "public"."Invoice" ("courseEnrollmentId");
CREATE INDEX "Invoice_status_idx" ON "public"."Invoice" ("status");
CREATE INDEX "Invoice_invoiceDate_idx" ON "public"."Invoice" ("invoiceDate");
