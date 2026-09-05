-- Split the settings-admin-only columns of "Organization" into their own
-- selectable object.
--
-- Hasura allows exactly one select permission per role and table, so the
-- org_admin_access read of "Organization" could not distinguish capabilities:
-- ANY OrganizationAdmin row — a job-board grant with canManageJobs and nothing
-- else included — could read the organization's banking, tax and register data,
-- its invoicing configuration and its integration credentials. The StuJo
-- migration made that concrete: employer contacts of a legacy company that
-- name-matched an existing EduHub organization became job-only admins there and
-- could read that organization's billing record.
--
-- These columns move to this view, whose permission requires canManageSettings.
-- Writes are unaffected: they go to "Organization" and already require that
-- same capability. Columns that are public on "Organization" (the Ghost
-- newsletter endpoint fields, readable by `anonymous`) are deliberately NOT
-- here — hiding them from org admins alone would protect nothing.
CREATE VIEW "public"."OrganizationSettings" AS
SELECT
  o."id",
  -- Integration credentials
  o."apiKeyHash",
  o."ghostNewsletterApiKeyConfigured",
  -- Legal identity / commercial register
  o."legalName",
  o."legalForm",
  o."managingDirector",
  o."registerCourt",
  o."registerNumber",
  -- Tax and banking
  o."taxNumber",
  o."vatId",
  o."bankName",
  -- Invoicing configuration (seller side: what goes onto the Stripe invoice)
  o."invoiceFooterText",
  o."invoiceNumberPrefix",
  o."defaultVatRate",
  o."defaultTaxExemptionNote"
FROM "public"."Organization" o;

COMMENT ON VIEW "public"."OrganizationSettings" IS E'Settings-admin-only columns of Organization (integration credentials, legal/tax/banking identity, invoicing configuration). Readable via Hasura only by an OrganizationAdmin with canManageSettings; writes still go to Organization, which requires the same capability. "id" is the Organization id.';
