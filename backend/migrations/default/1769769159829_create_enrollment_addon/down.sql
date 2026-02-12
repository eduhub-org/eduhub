-- Drop CourseEnrollmentAddon table (or rename back to EnrollmentAddon if it was renamed)
DO $$
BEGIN
  -- If CourseEnrollmentAddon exists AND EnrollmentAddon does NOT exist,
  -- it means the up migration performed a rename, so we should rename back
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'CourseEnrollmentAddon') THEN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'EnrollmentAddon') THEN
      -- Up migration renamed EnrollmentAddon to CourseEnrollmentAddon, so rename back
      ALTER TABLE "public"."CourseEnrollmentAddon" RENAME TO "EnrollmentAddon";
      
      -- Rename indexes back to original names
      IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'CourseEnrollmentAddon_enrollmentId_addonMappingId_key') THEN
        ALTER INDEX "public"."CourseEnrollmentAddon_enrollmentId_addonMappingId_key" RENAME TO "EnrollmentAddon_enrollmentId_addonMappingId_key";
      END IF;
      IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'CourseEnrollmentAddon_enrollmentId_idx') THEN
        ALTER INDEX "public"."CourseEnrollmentAddon_enrollmentId_idx" RENAME TO "EnrollmentAddon_enrollmentId_idx";
      END IF;
      IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'CourseEnrollmentAddon_addonMappingId_idx') THEN
        ALTER INDEX "public"."CourseEnrollmentAddon_addonMappingId_idx" RENAME TO "EnrollmentAddon_addonMappingId_idx";
      END IF;
    ELSE
      -- Up migration created CourseEnrollmentAddon fresh (EnrollmentAddon already existed),
      -- so drop the table and indexes
      DROP INDEX IF EXISTS "public"."CourseEnrollmentAddon_enrollmentId_idx";
      DROP INDEX IF EXISTS "public"."CourseEnrollmentAddon_addonMappingId_idx";
      DROP INDEX IF EXISTS "public"."CourseEnrollmentAddon_enrollmentId_addonMappingId_key";
      DROP TABLE IF EXISTS "public"."CourseEnrollmentAddon";
    END IF;
  END IF;
END $$;
