ALTER TABLE "public"."Organization"
  ADD COLUMN "newsletterDescription" text NULL;

COMMENT ON COLUMN "public"."Organization"."newsletterDescription"
IS E'Short organization newsletter description shown to participants in onboarding and profile preferences.';
