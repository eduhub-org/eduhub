-- Remove billing organization reference
DROP INDEX IF EXISTS "CourseEnrollment_billingOrganizationId_idx";

ALTER TABLE "public"."CourseEnrollment"
DROP CONSTRAINT IF EXISTS "CourseEnrollment_billingOrganizationId_fkey";

ALTER TABLE "public"."CourseEnrollment"
DROP COLUMN IF EXISTS "billingOrganizationId";
