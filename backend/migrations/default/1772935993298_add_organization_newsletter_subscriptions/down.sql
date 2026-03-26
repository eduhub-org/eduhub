DROP TRIGGER IF EXISTS "set_public_OrganizationNewsletterSubscription_updated_at" ON "public"."OrganizationNewsletterSubscription";

DROP TABLE IF EXISTS "public"."OrganizationNewsletterSubscription";

ALTER TABLE "public"."Organization"
  DROP CONSTRAINT IF EXISTS "Organization_ghostNewsletterConfig_check";

ALTER TABLE "public"."Organization"
  DROP CONSTRAINT IF EXISTS "Organization_newsletterProvider_check";

ALTER TABLE "public"."Organization"
  DROP COLUMN IF EXISTS "ghostNewsletterDoubleOptInEnabled",
  DROP COLUMN IF EXISTS "ghostNewsletterLabel",
  DROP COLUMN IF EXISTS "ghostNewsletterSlug",
  DROP COLUMN IF EXISTS "ghostNewsletterListId",
  DROP COLUMN IF EXISTS "ghostNewsletterApiUrl",
  DROP COLUMN IF EXISTS "newsletterProvider";
