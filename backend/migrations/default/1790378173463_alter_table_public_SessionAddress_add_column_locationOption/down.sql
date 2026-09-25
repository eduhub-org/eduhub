DELETE FROM "public"."SessionAddress" WHERE "locationOption" IS NOT NULL;

DROP TRIGGER IF EXISTS validate_session_address_location_consistency_trigger ON "public"."SessionAddress";

CREATE OR REPLACE FUNCTION validate_session_address_location_consistency()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."locationAddressId" IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1
            FROM "public"."LocationAddress" la
            INNER JOIN "public"."CourseLocation" cl ON la."locationOption" = cl."locationOption"
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

CREATE TRIGGER validate_session_address_location_consistency_trigger
BEFORE INSERT OR UPDATE OF "locationAddressId", "courseLocationId"
ON "public"."SessionAddress"
FOR EACH ROW EXECUTE FUNCTION validate_session_address_location_consistency();

ALTER TABLE "public"."SessionAddress" DROP CONSTRAINT IF EXISTS "SessionAddress_location_source";
ALTER TABLE "public"."SessionAddress" DROP CONSTRAINT IF EXISTS "SessionAddress_locationOption_fkey";
ALTER TABLE "public"."SessionAddress" DROP COLUMN IF EXISTS "locationOption";
