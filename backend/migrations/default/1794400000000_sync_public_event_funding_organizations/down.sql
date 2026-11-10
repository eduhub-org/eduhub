DROP TRIGGER IF EXISTS "sync_CourseFundingOrganization_to_public_event" ON "public"."CourseFundingOrganization";
DROP FUNCTION IF EXISTS "public"."sync_CourseFundingOrganization_to_public_event"();

CREATE OR REPLACE FUNCTION "public"."init_Course_from_sourceSession"()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."sourceSessionId" IS NULL THEN
    RETURN NULL;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW."sourceSessionId" IS NOT DISTINCT FROM OLD."sourceSessionId" THEN
    RETURN NULL;
  END IF;

  PERFORM "public"."sync_event_session_fields"(NEW."id");
  PERFORM "public"."sync_event_session_locations"(NEW."id");
  PERFORM "public"."sync_event_session_speakers"(NEW."id");

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS "public"."sync_event_funding_organizations"(integer);
