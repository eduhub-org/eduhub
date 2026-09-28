DELETE FROM "public"."Session" WHERE "programId" IS NOT NULL;
DROP INDEX IF EXISTS "public"."Session_programId_idx";
ALTER TABLE "public"."Session" DROP CONSTRAINT IF EXISTS "Session_course_xor_program";
ALTER TABLE "public"."Session" DROP CONSTRAINT IF EXISTS "Session_programId_fkey";
ALTER TABLE "public"."Session" DROP COLUMN IF EXISTS "programId";
ALTER TABLE "public"."Session" ALTER COLUMN "courseId" SET NOT NULL;
