ALTER TABLE "public"."Organization"
  DROP CONSTRAINT "Organization_ghostNewsletterCredential_check",
  DROP COLUMN "ghostNewsletterApiKeyConfigured",
  DROP COLUMN "ghostNewsletterApiKeyEncrypted";
