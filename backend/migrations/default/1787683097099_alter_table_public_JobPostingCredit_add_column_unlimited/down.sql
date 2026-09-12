-- The duplicate-row merge in up.sql is not reversible. Preserve unlimited
-- grants with the legacy fallback before removing their native representation.
DROP INDEX IF EXISTS "public"."JobPostingCredit_organizationId_untyped_unique";

UPDATE "public"."JobPostingCredit"
SET "remaining" = 100000
WHERE "unlimited" = true;

ALTER TABLE "public"."JobPostingCredit" DROP COLUMN IF EXISTS "unlimited";
