-- Remove location column from CourseEnrollment table

ALTER TABLE "public"."CourseEnrollment"
DROP CONSTRAINT IF EXISTS "CourseEnrollment_location_fkey";

ALTER TABLE "public"."CourseEnrollment"
DROP COLUMN IF EXISTS "location";

