-- Drop indexes first
DROP INDEX IF EXISTS "public"."CourseEnrollmentAddon_enrollmentId_idx";
DROP INDEX IF EXISTS "public"."CourseEnrollmentAddon_addonMappingId_idx";
DROP INDEX IF EXISTS "public"."CourseEnrollmentAddon_enrollmentId_addonMappingId_key";

-- Drop CourseEnrollmentAddon table (or rename back to EnrollmentAddon if it was renamed)
DO $$
BEGIN
  -- If CourseEnrollmentAddon exists, drop it or rename back
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'CourseEnrollmentAddon') THEN
    DROP TABLE IF EXISTS "public"."CourseEnrollmentAddon";
  END IF;
END $$;
