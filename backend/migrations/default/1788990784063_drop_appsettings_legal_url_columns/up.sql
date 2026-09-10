-- The per-portal legal-URL overrides are gone: every StuJo portal now serves
-- the in-app /impressum, /datenschutz and /agb, so the frontend no longer
-- reads these columns. Nothing ever wrote them either -- the seed migrations
-- set only appName/domain/defaultLocale and there was never an admin UI, so
-- they are NULL in every row. See docs/LEGAL_DOCUMENTS.md.
--
-- No IF EXISTS: if a column is already missing the migration history is wrong
-- and this should fail rather than pass silently. Nothing depends on the
-- columns (no view, function, index or constraint), so no CASCADE either.

-- Enforced rather than asserted: if any row still carries a configured
-- override, fail the migration instead of discarding it. Under the
-- cli-migrations-v3 image that stops the container from starting, which is the
-- right failure mode -- a lost legal URL would be silent otherwise. A no-op
-- wherever the columns are NULL, which is everywhere today.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "public"."AppSettings"
    WHERE "imprintUrl" IS NOT NULL OR "privacyUrl" IS NOT NULL OR "termsUrl" IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'AppSettings legal URL columns contain live values; drop aborted';
  END IF;
END
$$;

ALTER TABLE "public"."AppSettings"
  DROP COLUMN "imprintUrl",
  DROP COLUMN "privacyUrl",
  DROP COLUMN "termsUrl";
