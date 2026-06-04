DROP INDEX IF EXISTS "public"."Project_submittedBy_idx";

ALTER TABLE "public"."Project"
DROP CONSTRAINT IF EXISTS "Project_submittedBy_fkey";
