-- NULL means "no participant limit". A limit of 0 (what the course editor
-- used to show for an unset field) made every registration check treat the
-- course as full, so everyone landed on the waitlist. Store it as no limit.
UPDATE "public"."Course" SET "maxParticipants" = NULL WHERE "maxParticipants" <= 0;

CREATE OR REPLACE FUNCTION "public"."normalize_Course_maxParticipants"()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."maxParticipants" <= 0 THEN
    NEW."maxParticipants" := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "normalize_Course_maxParticipants"
BEFORE INSERT OR UPDATE OF "maxParticipants" ON "public"."Course"
FOR EACH ROW EXECUTE FUNCTION "public"."normalize_Course_maxParticipants"();

COMMENT ON COLUMN "public"."Course"."maxParticipants" IS 'Participant limit; NULL means no limit (0 or less is stored as NULL)';
