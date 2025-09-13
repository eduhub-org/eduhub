-- Drop parent update guards
DROP TRIGGER IF EXISTS guard_location_address_option_updates_trigger ON "public"."LocationAddress";
DROP FUNCTION IF EXISTS guard_location_address_option_updates();

DROP TRIGGER IF EXISTS guard_course_location_option_updates_trigger ON "public"."CourseLocation";
DROP FUNCTION IF EXISTS guard_course_location_option_updates();

-- Drop consistency trigger
DROP TRIGGER IF EXISTS validate_session_address_location_consistency_trigger ON "public"."SessionAddress";
DROP FUNCTION IF EXISTS validate_session_address_location_consistency();

-- Drop FKs and restore original constraints
ALTER TABLE "public"."SessionAddress"
  DROP CONSTRAINT IF EXISTS "SessionAddress_locationAddressId_fkey";

-- Restore original SessionAddress_locationAddressId_fkey constraint
ALTER TABLE "public"."SessionAddress"
  ADD CONSTRAINT "SessionAddress_locationAddressId_fkey"
  FOREIGN KEY ("locationAddressId") REFERENCES "public"."LocationAddress"("id")
  ON UPDATE RESTRICT ON DELETE SET NULL;

ALTER TABLE "public"."SessionAddress"
  DROP CONSTRAINT IF EXISTS "SessionAddress_courseLocationId_fkey";

-- Restore original SessionAddress_courseLocationId_fkey constraint  
ALTER TABLE "public"."SessionAddress"
  ADD CONSTRAINT "SessionAddress_courseLocationId_fkey"
  FOREIGN KEY ("courseLocationId") REFERENCES "public"."CourseLocation"("id")
  ON UPDATE CASCADE ON DELETE CASCADE;

-- Drop helper indexes (optional; keep if shared)
DROP INDEX IF EXISTS idx_session_address_location_address_id;
DROP INDEX IF EXISTS idx_session_address_course_location_id;
-- Keep or drop these depending on broader usage:
-- DROP INDEX IF EXISTS idx_location_address_location_option_id;
-- DROP INDEX IF EXISTS idx_course_location_location_option;
