-- ---------- Referential integrity (concurrency-safe) ----------
-- SessionAddress -> LocationAddress: allow NULLs, check at COMMIT
CREATE INDEX IF NOT EXISTS idx_session_address_location_address_id
  ON "public"."SessionAddress" ("locationAddressId");

ALTER TABLE "public"."SessionAddress"
  ADD CONSTRAINT "SessionAddress_locationAddressId_fkey"
  FOREIGN KEY ("locationAddressId")
  REFERENCES "public"."LocationAddress" ("id")
  DEFERRABLE INITIALLY DEFERRED;

-- Also add the standard FK to CourseLocation (not necessarily deferred)
CREATE INDEX IF NOT EXISTS idx_session_address_course_location_id
  ON "public"."SessionAddress" ("courseLocationId");

ALTER TABLE "public"."SessionAddress"
  ADD CONSTRAINT "SessionAddress_courseLocationId_fkey"
  FOREIGN KEY ("courseLocationId")
  REFERENCES "public"."CourseLocation" ("id");

-- Helpful indexes for the option join used by validations
CREATE INDEX IF NOT EXISTS idx_location_address_location_option_id 
  ON "public"."LocationAddress" ("locationOptionId");

CREATE INDEX IF NOT EXISTS idx_course_location_location_option 
  ON "public"."CourseLocation" ("locationOption");


-- ---------- Business rule: option consistency ----------
-- A SessionAddress may only reference a LocationAddress whose locationOptionId
-- matches the CourseLocation.locationOption of the selected courseLocationId.

CREATE OR REPLACE FUNCTION validate_session_address_location_consistency()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check if a concrete address is set
  IF NEW."locationAddressId" IS NOT NULL THEN
    IF NEW."courseLocationId" IS NULL THEN
      RAISE EXCEPTION 'Cannot set locationAddressId when courseLocationId is NULL';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM "public"."LocationAddress" la
      JOIN "public"."CourseLocation" cl
        ON la."locationOptionId" = cl."locationOption"
      WHERE la."id" = NEW."locationAddressId"
        AND cl."id" = NEW."courseLocationId"
    ) THEN
      RAISE EXCEPTION
        'LocationAddress (ID: %) does not belong to the same location option as CourseLocation (ID: %).',
        NEW."locationAddressId", NEW."courseLocationId";
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_session_address_location_consistency_trigger
  BEFORE INSERT OR UPDATE OF "locationAddressId", "courseLocationId"
  ON "public"."SessionAddress"
  FOR EACH ROW
  EXECUTE FUNCTION validate_session_address_location_consistency();

COMMENT ON FUNCTION validate_session_address_location_consistency() IS
'Validates that SessionAddress.locationAddressId has the same location option as SessionAddress.courseLocationId';

COMMENT ON TRIGGER validate_session_address_location_consistency_trigger ON "public"."SessionAddress" IS
'Ensures SessionAddress references a LocationAddress consistent with its CourseLocation option';


-- ---------- Parent update guards ----------
-- If someone changes the option on CourseLocation or on LocationAddress,
-- prevent breaking existing SessionAddress rows.

CREATE OR REPLACE FUNCTION guard_course_location_option_updates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."locationOption" <> OLD."locationOption" THEN
    -- Any existing SessionAddress referencing this CourseLocation must still match
    IF EXISTS (
      SELECT 1
      FROM "public"."SessionAddress" sa
      JOIN "public"."LocationAddress" la
        ON la."id" = sa."locationAddressId"
      WHERE sa."courseLocationId" = OLD."id"
        AND sa."locationAddressId" IS NOT NULL
        AND la."locationOptionId" <> NEW."locationOption"
    ) THEN
      RAISE EXCEPTION
        'Changing CourseLocation(ID: %) locationOption would break existing SessionAddress rows.',
        OLD."id";
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guard_course_location_option_updates_trigger
  BEFORE UPDATE OF "locationOption" ON "public"."CourseLocation"
  FOR EACH ROW
  EXECUTE FUNCTION guard_course_location_option_updates();


CREATE OR REPLACE FUNCTION guard_location_address_option_updates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."locationOptionId" <> OLD."locationOptionId" THEN
    -- Any existing SessionAddress referencing this LocationAddress must still match
    IF EXISTS (
      SELECT 1
      FROM "public"."SessionAddress" sa
      JOIN "public"."CourseLocation" cl
        ON cl."id" = sa."courseLocationId"
      WHERE sa."locationAddressId" = OLD."id"
        AND cl."locationOption" <> NEW."locationOptionId"
    ) THEN
      RAISE EXCEPTION
        'Changing LocationAddress(ID: %) locationOptionId would break existing SessionAddress rows.',
        OLD."id";
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guard_location_address_option_updates_trigger
  BEFORE UPDATE OF "locationOptionId" ON "public"."LocationAddress"
  FOR EACH ROW
  EXECUTE FUNCTION guard_location_address_option_updates();

COMMENT ON FUNCTION guard_course_location_option_updates() IS
'Prevents updates to CourseLocation.locationOption that would invalidate existing SessionAddress rows';

COMMENT ON FUNCTION guard_location_address_option_updates() IS
'Prevents updates to LocationAddress.locationOptionId that would invalidate existing SessionAddress rows';


-- ---------- Notes ----------
-- * We DO NOT add ON DELETE RESTRICT; the default NO ACTION with DEFERRABLE on the
--   SessionAddress -> LocationAddress FK lets you delete a LocationAddress and, in the
--   same transaction, null/repoint SessionAddress rows before COMMIT.
-- * If you truly do soft deletes via a flag on LocationAddress, this FK can’t enforce
--   “no references to soft-deleted rows.” If you need that, add a separate trigger
--   on SessionAddress writes or enforce through a VIEW with WITH CHECK OPTION that
--   only exposes non-deleted addresses for writes.
