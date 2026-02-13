-- Add missing Organization fields (in case migration 1769773700000 was applied with old content)
-- Adds: legalName, legalForm, invoiceFooterText, invoiceNumberPrefix, defaultVatRate, defaultTaxExemptionNote
-- Adds: Organization.country FK to Country.code
DO $$
BEGIN
  -- Add legalName if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Organization' AND column_name = 'legalName') THEN
    ALTER TABLE "public"."Organization" ADD COLUMN "legalName" text NULL;
    COMMENT ON COLUMN "public"."Organization"."legalName" IS 'Registered legal name of the organization. Used on invoices; falls back to name if NULL';
  END IF;

  -- Add legalForm if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Organization' AND column_name = 'legalForm') THEN
    ALTER TABLE "public"."Organization" ADD COLUMN "legalForm" text NULL;
    COMMENT ON COLUMN "public"."Organization"."legalForm" IS 'Legal form of the organization (e.g. GmbH, gGmbH, e.V., UG, AG). Required for German invoices';
  END IF;

  -- Add invoiceFooterText if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Organization' AND column_name = 'invoiceFooterText') THEN
    ALTER TABLE "public"."Organization" ADD COLUMN "invoiceFooterText" text NULL;
    COMMENT ON COLUMN "public"."Organization"."invoiceFooterText" IS 'Custom footer text for invoices (tax exemption clauses, legal notices, cancellation policy links)';
  END IF;

  -- Add invoiceNumberPrefix if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Organization' AND column_name = 'invoiceNumberPrefix') THEN
    ALTER TABLE "public"."Organization" ADD COLUMN "invoiceNumberPrefix" text NULL;
    COMMENT ON COLUMN "public"."Organization"."invoiceNumberPrefix" IS 'Prefix for invoice numbers (e.g. EDU). Used when generating invoices via Stripe API';
  END IF;

  -- Add defaultVatRate if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Organization' AND column_name = 'defaultVatRate') THEN
    ALTER TABLE "public"."Organization" ADD COLUMN "defaultVatRate" numeric(5,2) NULL;
    COMMENT ON COLUMN "public"."Organization"."defaultVatRate" IS 'Default VAT rate for this organization (e.g. 19.00, 7.00, 0.00). Used when creating Stripe products';
  END IF;

  -- Add defaultTaxExemptionNote if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Organization' AND column_name = 'defaultTaxExemptionNote') THEN
    ALTER TABLE "public"."Organization" ADD COLUMN "defaultTaxExemptionNote" text NULL;
    COMMENT ON COLUMN "public"."Organization"."defaultTaxExemptionNote" IS 'Default legal note when VAT is 0% (e.g. Umsatzsteuerbefreit gem. Paragraph 4 Nr. 21 UStG)';
  END IF;

  -- Add country FK if not exists (only if Country table exists and constraint not present)
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND constraint_name = 'Organization_country_fkey') THEN
    -- Clear any invalid country values before adding FK
    UPDATE "public"."Organization" SET "country" = NULL WHERE "country" IS NOT NULL AND "country" NOT IN (SELECT "code" FROM "public"."Country");
    ALTER TABLE "public"."Organization"
    ADD CONSTRAINT "Organization_country_fkey"
    FOREIGN KEY ("country")
    REFERENCES "public"."Country" ("code")
    ON UPDATE RESTRICT ON DELETE RESTRICT;
  END IF;
END $$;
