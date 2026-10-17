-- Copyright line of a course's cover image, shown under the cover and sent to
-- external event platforms (Rausgegangen allows at most 120 characters).
ALTER TABLE "public"."Course" ADD COLUMN "coverImageCredits" text NULL;
ALTER TABLE "public"."Course"
  ADD CONSTRAINT "Course_coverImageCredits_length" CHECK (char_length("coverImageCredits") <= 120);

-- Per-organization Rausgegangen API key, stored encrypted like the Ghost
-- newsletter key (AES-256-GCM, "v1:iv:tag:ciphertext"). Only the configured
-- flag is ever readable; the ciphertext is read with the admin secret by the
-- node functions alone.
ALTER TABLE "public"."Organization"
  ADD COLUMN "rausgegangenApiKeyEncrypted" text NULL,
  ADD COLUMN "rausgegangenApiKeyConfigured" boolean NOT NULL DEFAULT false,
  -- While on, events are sent unpublished so they can be checked in the
  -- Rausgegangen backend (preview link) before going live.
  ADD COLUMN "rausgegangenTestMode" boolean NOT NULL DEFAULT true;

CREATE OR REPLACE VIEW "public"."OrganizationSettings" AS
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
  o."defaultTaxExemptionNote",
  -- Rausgegangen integration
  o."rausgegangenApiKeyConfigured",
  o."rausgegangenTestMode"
FROM "public"."Organization" o;
