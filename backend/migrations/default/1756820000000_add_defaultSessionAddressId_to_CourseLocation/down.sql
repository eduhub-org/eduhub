-- Rollback: Remove defaultSessionAddressId column from CourseLocation table

-- Drop the index first
DROP INDEX IF EXISTS "public"."idx_course_location_default_session_address_id";

-- Drop the foreign key constraint (the column drop will cascade, but explicit is clearer)
ALTER TABLE "public"."CourseLocation" 
DROP CONSTRAINT IF EXISTS "CourseLocation_defaultSessionAddressId_fkey";

-- Drop the column
ALTER TABLE "public"."CourseLocation" 
DROP COLUMN IF EXISTS "defaultSessionAddressId";


