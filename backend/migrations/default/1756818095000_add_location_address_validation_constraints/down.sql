-- Drop parent update guards
DROP TRIGGER IF EXISTS guard_location_address_option_updates_trigger ON "public"."LocationAddress";
DROP FUNCTION IF EXISTS guard_location_address_option_updates();

DROP TRIGGER IF EXISTS guard_course_location_option_updates_trigger ON "public"."CourseLocation";
DROP FUNCTION IF EXISTS guard_course_location_option_updates();

-- Drop consistency trigger
DROP TRIGGER IF EXISTS validate_session_address_location_consistency_trigger ON "public"."SessionAddress";
DROP FUNCTION IF EXISTS validate_session_address_location_consistency();

-- Drop FKs
ALTER TABLE "public"."SessionAddress"
  DROP CONSTRAINT IF EXISTS "SessionAddress_locationAddressId_fkey";

ALTER TABLE "public"."SessionAddress"
  DROP CONSTRAINT IF EXISTS "SessionAddress_courseLocationId_fkey";

-- Drop helper indexes (optional; keep if shared)
DROP INDEX IF EXISTS idx_session_address_location_address_id;
DROP INDEX IF EXISTS idx_session_address_course_location_id;
-- Keep or drop these depending on broader usage:
-- DROP INDEX IF EXISTS idx_location_address_location_option_id;
-- DROP INDEX IF EXISTS idx_course_location_location_option;
