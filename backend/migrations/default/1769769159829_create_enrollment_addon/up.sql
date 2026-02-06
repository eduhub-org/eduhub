-- Create CourseEnrollmentAddon junction table to track which add-ons were booked for each enrollment
-- First, check if the old table name exists and rename it, otherwise create the new table
DO $$
BEGIN
  -- If EnrollmentAddon table exists, rename it to CourseEnrollmentAddon
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'EnrollmentAddon') THEN
    ALTER TABLE "public"."EnrollmentAddon" RENAME TO "CourseEnrollmentAddon";
    
    -- Rename indexes
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'EnrollmentAddon_enrollmentId_addonMappingId_key') THEN
      ALTER INDEX "public"."EnrollmentAddon_enrollmentId_addonMappingId_key" RENAME TO "CourseEnrollmentAddon_enrollmentId_addonMappingId_key";
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'EnrollmentAddon_enrollmentId_idx') THEN
      ALTER INDEX "public"."EnrollmentAddon_enrollmentId_idx" RENAME TO "CourseEnrollmentAddon_enrollmentId_idx";
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'EnrollmentAddon_addonMappingId_idx') THEN
      ALTER INDEX "public"."EnrollmentAddon_addonMappingId_idx" RENAME TO "CourseEnrollmentAddon_addonMappingId_idx";
    END IF;
  ELSE
    -- Create the table if it doesn't exist
    CREATE TABLE IF NOT EXISTS "public"."CourseEnrollmentAddon" (
      "id" serial PRIMARY KEY,
      "enrollmentId" integer NOT NULL REFERENCES "public"."CourseEnrollment"("id") ON DELETE CASCADE,
      "addonMappingId" integer NOT NULL REFERENCES "public"."CourseAddonMapping"("id") ON DELETE RESTRICT,
      "priceAtPurchase" integer NOT NULL,  -- Price in cents at time of purchase
      "currency" text NOT NULL DEFAULT 'EUR',
      "created_at" timestamptz NOT NULL DEFAULT now()
    );

    -- Ensure one enrollment can only have one instance of each add-on
    CREATE UNIQUE INDEX IF NOT EXISTS "CourseEnrollmentAddon_enrollmentId_addonMappingId_key" ON "public"."CourseEnrollmentAddon" ("enrollmentId", "addonMappingId");

    -- Add indexes on foreign keys for optimized lookups
    CREATE INDEX IF NOT EXISTS "CourseEnrollmentAddon_enrollmentId_idx" ON "public"."CourseEnrollmentAddon" ("enrollmentId");
    CREATE INDEX IF NOT EXISTS "CourseEnrollmentAddon_addonMappingId_idx" ON "public"."CourseEnrollmentAddon" ("addonMappingId");
  END IF;
END $$;

-- Add comment (will update if table was renamed)
COMMENT ON TABLE "public"."CourseEnrollmentAddon" IS 'Tracks which add-ons were selected and purchased for each course enrollment';
