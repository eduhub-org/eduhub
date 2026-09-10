-- The per-portal legal-URL overrides are gone: every StuJo portal now serves
-- the in-app /impressum, /datenschutz and /agb, so the frontend no longer
-- reads these columns. Nothing ever wrote them either -- the seed migrations
-- set only appName/domain/defaultLocale and there was never an admin UI, so
-- they are NULL in every row. See docs/LEGAL_DOCUMENTS.md.
--
-- No IF EXISTS: if a column is already missing the migration history is wrong
-- and this should fail rather than pass silently. Nothing depends on the
-- columns (no view, function, index or constraint), so no CASCADE either.
ALTER TABLE "public"."AppSettings"
  DROP COLUMN "imprintUrl",
  DROP COLUMN "privacyUrl",
  DROP COLUMN "termsUrl";
