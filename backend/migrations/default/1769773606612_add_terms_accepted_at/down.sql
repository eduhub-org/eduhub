-- Remove termsAcceptedAt column
ALTER TABLE "public"."CourseEnrollment"
DROP COLUMN IF EXISTS "termsAcceptedAt";
