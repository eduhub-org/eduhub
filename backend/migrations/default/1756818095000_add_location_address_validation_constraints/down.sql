-- Remove validation constraints and triggers

-- Drop the triggers first
DROP TRIGGER IF EXISTS validate_session_address_location_consistency_trigger ON "public"."SessionAddress";
DROP TRIGGER IF EXISTS prevent_location_address_deletion_trigger ON "public"."LocationAddress";

-- Drop the functions
DROP FUNCTION IF EXISTS validate_session_address_location_consistency();
DROP FUNCTION IF EXISTS prevent_location_address_deletion_if_referenced();

-- Drop the performance indexes (if they were created by this migration)
-- Note: We use IF EXISTS because these indexes might be used by other parts of the system
DROP INDEX IF EXISTS idx_location_address_location_option_id;
DROP INDEX IF EXISTS idx_course_location_location_option;
