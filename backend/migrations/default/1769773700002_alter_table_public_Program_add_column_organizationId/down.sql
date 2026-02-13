-- Remove FK constraint and column
ALTER TABLE "public"."Program"
DROP CONSTRAINT IF EXISTS "Program_organizationId_fkey";

ALTER TABLE "public"."Program"
DROP COLUMN IF EXISTS "organizationId";
