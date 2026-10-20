-- A view cannot lose columns through CREATE OR REPLACE.
DROP VIEW "public"."OrganizationSettings";
CREATE VIEW "public"."OrganizationSettings" AS
SELECT
  o."id",
  o."apiKeyHash",
  o."ghostNewsletterApiKeyConfigured",
  o."legalName",
  o."legalForm",
  o."managingDirector",
  o."registerCourt",
  o."registerNumber",
  o."taxNumber",
  o."vatId",
  o."bankName",
  o."invoiceFooterText",
  o."invoiceNumberPrefix",
  o."defaultVatRate",
  o."defaultTaxExemptionNote"
FROM "public"."Organization" o;

COMMENT ON VIEW "public"."OrganizationSettings" IS E'Settings-admin-only columns of Organization (integration credentials, legal/tax/banking identity, invoicing configuration). Readable via Hasura only by an OrganizationAdmin with canManageSettings; writes still go to Organization, which requires the same capability. "id" is the Organization id.';

ALTER TABLE "public"."Organization"
  DROP COLUMN IF EXISTS "rausgegangenApiKeyEncrypted",
  DROP COLUMN IF EXISTS "rausgegangenApiKeyConfigured",
  DROP COLUMN IF EXISTS "rausgegangenTestMode";

ALTER TABLE "public"."Course" DROP COLUMN IF EXISTS "coverImageCredits";
