-- Add invoice address fields (mandatory details per Section 14 UStG)
ALTER TABLE "public"."Organization"
ADD COLUMN "addressLine1" text NULL,
ADD COLUMN "addressLine2" text NULL,
ADD COLUMN "postalCode" text NULL,
ADD COLUMN "city" text NULL,
ADD COLUMN "country" text NULL,
ADD COLUMN "legalName" text NULL,
ADD COLUMN "legalForm" text NULL,
ADD COLUMN "taxNumber" text NULL,
ADD COLUMN "vatId" text NULL,
ADD COLUMN "managingDirector" text NULL,
ADD COLUMN "registerCourt" text NULL,
ADD COLUMN "registerNumber" text NULL,
ADD COLUMN "email" text NULL,
ADD COLUMN "phone" text NULL,
ADD COLUMN "website" text NULL;

COMMENT ON COLUMN "public"."Organization"."addressLine1" IS 'Street and house number for invoice and correspondence address';
COMMENT ON COLUMN "public"."Organization"."addressLine2" IS 'Additional address line (c/o, building, floor) for invoice and correspondence';
COMMENT ON COLUMN "public"."Organization"."postalCode" IS 'Postal/ZIP code for invoice and correspondence address';
COMMENT ON COLUMN "public"."Organization"."city" IS 'City for invoice and correspondence address';
COMMENT ON COLUMN "public"."Organization"."country" IS 'Country for invoice and correspondence address. ISO 3166-1 alpha-2 code (e.g. DE, AT, CH). References Country.code';
COMMENT ON COLUMN "public"."Organization"."legalName" IS 'Registered legal name of the organization. Used on invoices; falls back to name if NULL';
COMMENT ON COLUMN "public"."Organization"."legalForm" IS 'Legal form of the organization (e.g. GmbH, gGmbH, e.V., UG, AG). Required for German invoices';
COMMENT ON COLUMN "public"."Organization"."taxNumber" IS 'German tax number / Steuernummer (e.g. 19/294/31504). Shown on invoices';
COMMENT ON COLUMN "public"."Organization"."vatId" IS 'EU VAT identification number / USt-IdNr (e.g. DE262929911). Shown on invoices for B2B';
COMMENT ON COLUMN "public"."Organization"."managingDirector" IS 'Managing director(s) / Geschaeftsfuehrer. Legal representative of the organization';
COMMENT ON COLUMN "public"."Organization"."registerCourt" IS 'Court of registration / Registergericht (e.g. Amtsgericht Hamburg)';
COMMENT ON COLUMN "public"."Organization"."registerNumber" IS 'Commercial register number / Handelsregisternummer (e.g. HRB 12345)';
COMMENT ON COLUMN "public"."Organization"."email" IS 'Contact email for invoices and correspondence';
COMMENT ON COLUMN "public"."Organization"."phone" IS 'Contact phone for invoices and correspondence';
COMMENT ON COLUMN "public"."Organization"."website" IS 'Organization website URL';

-- Add bank details (common on German invoices)
ALTER TABLE "public"."Organization"
ADD COLUMN "bankName" text NULL,
ADD COLUMN "bankIban" text NULL,
ADD COLUMN "bankBic" text NULL;

COMMENT ON COLUMN "public"."Organization"."bankName" IS 'Bank name for payment details on invoices';
COMMENT ON COLUMN "public"."Organization"."bankIban" IS 'IBAN for invoice payment details';
COMMENT ON COLUMN "public"."Organization"."bankBic" IS 'BIC/SWIFT code for invoice payment details';

-- Add invoicing default fields
ALTER TABLE "public"."Organization"
ADD COLUMN "invoiceFooterText" text NULL,
ADD COLUMN "invoiceNumberPrefix" text NULL,
ADD COLUMN "defaultVatRate" numeric(5,2) NULL,
ADD COLUMN "defaultTaxExemptionNote" text NULL;

COMMENT ON COLUMN "public"."Organization"."invoiceFooterText" IS 'Custom footer text for invoices (tax exemption clauses, legal notices, cancellation policy links)';
COMMENT ON COLUMN "public"."Organization"."invoiceNumberPrefix" IS 'Prefix for invoice numbers (e.g. EDU). Used when generating invoices via Stripe API';
COMMENT ON COLUMN "public"."Organization"."defaultVatRate" IS 'Default VAT rate for this organization (e.g. 19.00, 7.00, 0.00). Used when creating Stripe products';
COMMENT ON COLUMN "public"."Organization"."defaultTaxExemptionNote" IS 'Default legal note when VAT is 0% (e.g. Umsatzsteuerbefreit gem. Paragraph 4 Nr. 21 UStG)';

-- Add foreign key constraint for country (ISO 3166-1 alpha-2)
ALTER TABLE "public"."Organization"
ADD CONSTRAINT "Organization_country_fkey"
FOREIGN KEY ("country")
REFERENCES "public"."Country" ("code")
ON UPDATE RESTRICT ON DELETE RESTRICT;

-- Add Stripe integration fields
ALTER TABLE "public"."Organization"
ADD COLUMN "stripeSecretKey" text NULL,
ADD COLUMN "stripeWebhookSecret" text NULL,
ADD COLUMN "stripePublishableKey" text NULL;

COMMENT ON COLUMN "public"."Organization"."stripeSecretKey" IS 'SENSITIVE - Stripe secret API key. Needs application-layer encryption before production use';
COMMENT ON COLUMN "public"."Organization"."stripeWebhookSecret" IS 'SENSITIVE - Stripe webhook signing secret. Needs application-layer encryption before production use';
COMMENT ON COLUMN "public"."Organization"."stripePublishableKey" IS 'Stripe publishable API key (safe for frontend)';

-- Add Formbricks integration fields
ALTER TABLE "public"."Organization"
ADD COLUMN "formbricksApiKey" text NULL,
ADD COLUMN "formbricksApiUrl" text NULL;

COMMENT ON COLUMN "public"."Organization"."formbricksApiKey" IS 'SENSITIVE - Formbricks Management API key. Needs application-layer encryption before production use';
COMMENT ON COLUMN "public"."Organization"."formbricksApiUrl" IS 'Base URL of Formbricks instance (e.g. https://app.formbricks.com)';
