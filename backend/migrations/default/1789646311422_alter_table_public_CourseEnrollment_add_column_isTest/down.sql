DROP INDEX IF EXISTS "public"."CourseEnrollment_isTest_idx";

ALTER TABLE "public"."CourseEnrollment"
  DROP COLUMN IF EXISTS "isTest";
