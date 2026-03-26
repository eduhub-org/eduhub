ALTER TABLE "public"."Organization"
  ADD COLUMN "ghostNewsletterApiKeyEncrypted" text NULL,
  ADD COLUMN "ghostNewsletterApiKeyConfigured" boolean NOT NULL DEFAULT false;

ALTER TABLE "public"."Organization"
  ADD CONSTRAINT "Organization_ghostNewsletterCredential_check"
  CHECK (
    "ghostNewsletterApiKeyConfigured" = false
    OR ("ghostNewsletterApiKeyEncrypted" IS NOT NULL AND btrim("ghostNewsletterApiKeyEncrypted") <> '')
  );

COMMENT ON COLUMN "public"."Organization"."ghostNewsletterApiKeyEncrypted"
IS E'Encrypted Ghost newsletter API credential (AES-256-GCM payload). Plaintext is never stored.';

COMMENT ON COLUMN "public"."Organization"."ghostNewsletterApiKeyConfigured"
IS E'Flag indicating whether an encrypted Ghost newsletter API credential is configured.';
