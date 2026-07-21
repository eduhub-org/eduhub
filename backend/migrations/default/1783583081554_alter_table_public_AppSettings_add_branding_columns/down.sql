DROP INDEX IF EXISTS "public"."AppSettings_defaultLocale_idx";

ALTER TABLE "public"."AppSettings"
  DROP CONSTRAINT IF EXISTS "AppSettings_defaultLocale_fkey",
  DROP CONSTRAINT IF EXISTS "AppSettings_domain_unique",
  DROP COLUMN IF EXISTS "logoUrl",
  DROP COLUMN IF EXISTS "faviconUrl",
  DROP COLUMN IF EXISTS "primaryColor",
  DROP COLUMN IF EXISTS "secondaryColor",
  DROP COLUMN IF EXISTS "imprintUrl",
  DROP COLUMN IF EXISTS "privacyUrl",
  DROP COLUMN IF EXISTS "defaultLocale",
  DROP COLUMN IF EXISTS "domain";
