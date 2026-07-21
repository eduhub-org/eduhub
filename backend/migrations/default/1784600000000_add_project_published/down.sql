-- Best-effort reverse: fold the published flag back into the PUBLISHED status
-- before dropping the column. The original lifecycle status of published rows
-- cannot be recovered, so they all become PUBLISHED again (the pre-migration
-- representation).
UPDATE "public"."Project"
SET "status" = 'PUBLISHED'
WHERE "published" = true;

ALTER TABLE "public"."Project"
  DROP COLUMN "published";
