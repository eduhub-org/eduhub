-- Branding columns for white-label portals (StuJo integration).
ALTER TABLE "public"."AppSettings"
  ADD COLUMN "logoUrl" text NULL,
  ADD COLUMN "faviconUrl" text NULL,
  ADD COLUMN "primaryColor" text NULL,
  ADD COLUMN "secondaryColor" text NULL,
  ADD COLUMN "imprintUrl" text NULL,
  ADD COLUMN "privacyUrl" text NULL,
  ADD COLUMN "defaultLocale" text NOT NULL DEFAULT 'DE',
  ADD COLUMN "domain" text NULL;

ALTER TABLE "public"."AppSettings"
  ADD CONSTRAINT "AppSettings_domain_unique" UNIQUE ("domain");

ALTER TABLE "public"."AppSettings"
  ADD CONSTRAINT "AppSettings_defaultLocale_fkey"
  FOREIGN KEY ("defaultLocale") REFERENCES "public"."Language"("value")
  ON UPDATE RESTRICT ON DELETE RESTRICT;

COMMENT ON COLUMN "public"."AppSettings"."domain" IS 'Request host resolved to this app (e.g. cau.stujo.net); null for apps addressed by env var';
