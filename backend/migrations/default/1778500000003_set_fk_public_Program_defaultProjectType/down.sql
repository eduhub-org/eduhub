DROP INDEX IF EXISTS "public"."Program_defaultProjectType_idx";

ALTER TABLE "public"."Program"
DROP CONSTRAINT IF EXISTS "Program_defaultProjectType_fkey";
