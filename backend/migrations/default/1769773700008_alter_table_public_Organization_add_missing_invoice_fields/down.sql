-- Remove Organization country FK and added columns
ALTER TABLE "public"."Organization" DROP CONSTRAINT IF EXISTS "Organization_country_fkey";
ALTER TABLE "public"."Organization"
  DROP COLUMN IF EXISTS "legalName",
  DROP COLUMN IF EXISTS "legalForm",
  DROP COLUMN IF EXISTS "invoiceFooterText",
  DROP COLUMN IF EXISTS "invoiceNumberPrefix",
  DROP COLUMN IF EXISTS "defaultVatRate",
  DROP COLUMN IF EXISTS "defaultTaxExemptionNote";
