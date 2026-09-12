-- The duplicate-row merge in up.sql is not reversible; only the index and the
-- column are dropped here.
DROP INDEX IF EXISTS "public"."JobPostingCredit_organizationId_untyped_unique";

ALTER TABLE "public"."JobPostingCredit" DROP COLUMN IF EXISTS "unlimited";
