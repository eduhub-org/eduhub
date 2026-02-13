-- Remove FK constraint, index, and column
ALTER TABLE "public"."Program"
DROP CONSTRAINT IF EXISTS "Program_organizationId_fkey";

DROP INDEX IF EXISTS "public"."Program_organizationId_idx";

ALTER TABLE "public"."Program"
DROP COLUMN IF EXISTS "organizationId";
