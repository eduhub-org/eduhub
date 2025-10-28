-- Revert the validation trigger to use the old column name locationOptionId

-- Recreate the validation function with the old column name
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

COMMENT ON FUNCTION validate_session_address_location_consistency() IS 
'Validates that a SessionAddress.locationAddressId references a LocationAddress whose locationOptionId matches the CourseLocation.locationOption for the SessionAddress.courseLocationId';

-- Drop the new index and recreate the old one
DROP INDEX IF EXISTS idx_location_address_location_option;
CREATE INDEX IF NOT EXISTS idx_location_address_location_option_id 
ON "public"."LocationAddress" ("locationOptionId");

