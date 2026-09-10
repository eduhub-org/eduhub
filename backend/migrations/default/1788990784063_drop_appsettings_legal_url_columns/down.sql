-- Restores the columns as their original migrations created them
-- (1783583081554_alter_table_public_AppSettings_add_branding_columns for
-- imprintUrl/privacyUrl, which carried no comments, and
-- 1788200000003_alter_table_public_AppSettings_add_column_termsUrl). Restores
-- the schema only -- the values, all NULL when they were dropped, are gone.
ALTER TABLE "public"."AppSettings"
  ADD COLUMN "imprintUrl" text NULL,
  ADD COLUMN "privacyUrl" text NULL,
  ADD COLUMN "termsUrl" text NULL;

COMMENT ON COLUMN "public"."AppSettings"."termsUrl" IS 'Terms and conditions (AGB) URL for this white-label portal, shown in the footer and next to the paid-publish button. Null falls back to the StuJo default, matching how imprintUrl and privacyUrl behave.';
