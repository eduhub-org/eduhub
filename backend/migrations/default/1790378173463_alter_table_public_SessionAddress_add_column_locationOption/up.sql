-- Program sessions have no CourseLocation, so their SessionAddress rows carry
-- the location option themselves. Course session rows keep using
-- courseLocationId; a row never sets both.
ALTER TABLE "public"."SessionAddress" ADD COLUMN "locationOption" text NULL;

ALTER TABLE "public"."SessionAddress"
  ADD CONSTRAINT "SessionAddress_locationOption_fkey"
  FOREIGN KEY ("locationOption") REFERENCES "public"."LocationOption"("value")
  ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE "public"."SessionAddress"
  ADD CONSTRAINT "SessionAddress_location_source"
  CHECK ("courseLocationId" IS NULL OR "locationOption" IS NULL);

COMMENT ON COLUMN "public"."SessionAddress"."locationOption" IS 'Location option of a program session address (course session addresses use courseLocationId instead)';

CREATE OR REPLACE FUNCTION validate_session_address_location_consistency()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."locationAddressId" IS NOT NULL THEN
        IF NEW."courseLocationId" IS NOT NULL THEN
            -- Course session: the address must match the CourseLocation's option
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
        ELSE
            -- Program session: the address must match the row's own option
            IF NOT EXISTS (
                SELECT 1
                FROM "public"."LocationAddress" la
                WHERE la.id = NEW."locationAddressId"
                  AND la."locationOption" = NEW."locationOption"
            ) THEN
                RAISE EXCEPTION 'LocationAddress (ID: %) does not belong to location option %.',
                    NEW."locationAddressId", NEW."locationOption";
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_session_address_location_consistency_trigger ON "public"."SessionAddress";
CREATE TRIGGER validate_session_address_location_consistency_trigger
BEFORE INSERT OR UPDATE OF "locationAddressId", "courseLocationId", "locationOption"
ON "public"."SessionAddress"
FOR EACH ROW EXECUTE FUNCTION validate_session_address_location_consistency();
