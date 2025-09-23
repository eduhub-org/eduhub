-- Add validation constraints to ensure data integrity between LocationAddress and SessionAddress

-- Create a function to validate that LocationAddress.locationOptionId matches 
-- the CourseLocation.locationOption for the associated SessionAddress
CREATE OR REPLACE FUNCTION validate_session_address_location_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- Only validate if locationAddressId is being set (not null)
    -- Use explicit quoting to handle case sensitivity properly
    IF NEW."locationAddressId" IS NOT NULL THEN
        -- Check if the LocationAddress.locationOptionId matches the CourseLocation.locationOption
        IF NOT EXISTS (
            SELECT 1 
            FROM "public"."LocationAddress" la
            INNER JOIN "public"."CourseLocation" cl ON la."locationOptionId" = cl."locationOption"
            WHERE la.id = NEW."locationAddressId"
              AND cl.id = NEW."courseLocationId"
        ) THEN
            RAISE EXCEPTION 'LocationAddress (ID: %) does not belong to the same location option as CourseLocation (ID: %). Please select an address that matches the course location option.', 
                NEW."locationAddressId", NEW."courseLocationId";
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce this validation on SessionAddress inserts and updates
CREATE TRIGGER validate_session_address_location_consistency_trigger
    BEFORE INSERT OR UPDATE OF "locationAddressId", "courseLocationId" 
    ON "public"."SessionAddress"
    FOR EACH ROW
    EXECUTE FUNCTION validate_session_address_location_consistency();

COMMENT ON FUNCTION validate_session_address_location_consistency() IS 
'Validates that a SessionAddress.locationAddressId references a LocationAddress whose locationOptionId matches the CourseLocation.locationOption for the SessionAddress.courseLocationId';

COMMENT ON TRIGGER validate_session_address_location_consistency_trigger ON "public"."SessionAddress" IS 
'Ensures data integrity between SessionAddress and LocationAddress by validating location option consistency';

-- Create an index to improve performance of the validation query
CREATE INDEX IF NOT EXISTS idx_location_address_location_option_id 
ON "public"."LocationAddress" ("locationOptionId");

CREATE INDEX IF NOT EXISTS idx_course_location_location_option 
ON "public"."CourseLocation" ("locationOption");

-- Add a constraint to prevent soft deletes breaking referential integrity
-- This ensures that if a LocationAddress is referenced by SessionAddress records,
-- it cannot be deleted without explicit handling
-- Note: We use a trigger instead of a foreign key constraint to allow NULL locationAddressId

CREATE OR REPLACE FUNCTION prevent_location_address_deletion_if_referenced()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if any SessionAddress records reference this LocationAddress
    IF EXISTS (
        SELECT 1 
        FROM "public"."SessionAddress" 
        WHERE "locationAddressId" = OLD.id
    ) THEN
        RAISE EXCEPTION 'Cannot delete LocationAddress (ID: %) because it is referenced by % SessionAddress record(s). Please update or remove the referencing session addresses first.', 
            OLD.id, 
            (SELECT COUNT(*) FROM "public"."SessionAddress" WHERE "locationAddressId" = OLD.id);
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_location_address_deletion_trigger
    BEFORE DELETE ON "public"."LocationAddress"
    FOR EACH ROW
    EXECUTE FUNCTION prevent_location_address_deletion_if_referenced();

COMMENT ON FUNCTION prevent_location_address_deletion_if_referenced() IS 
'Prevents deletion of LocationAddress records that are still referenced by SessionAddress records';

COMMENT ON TRIGGER prevent_location_address_deletion_trigger ON "public"."LocationAddress" IS 
'Prevents deletion of LocationAddress records that are still in use by SessionAddress records';
