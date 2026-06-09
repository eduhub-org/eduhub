DELETE FROM "public"."CourseGroupOption" WHERE "title" = 'courses';

UPDATE "public"."CourseGroupOption" SET "programType" = NULL WHERE "title" IN ('event', 'degree');

DROP INDEX IF EXISTS "public"."CourseGroupOption_programType_idx";
DROP INDEX IF EXISTS "public"."CourseGroupOption_organizationId_idx";

ALTER TABLE "public"."CourseGroupOption" DROP CONSTRAINT IF EXISTS "CourseGroupOption_programType_fkey";
ALTER TABLE "public"."CourseGroupOption" DROP CONSTRAINT IF EXISTS "CourseGroupOption_organizationId_fkey";

ALTER TABLE "public"."CourseGroupOption" DROP COLUMN IF EXISTS "programType";
ALTER TABLE "public"."CourseGroupOption" DROP COLUMN IF EXISTS "organizationId";
