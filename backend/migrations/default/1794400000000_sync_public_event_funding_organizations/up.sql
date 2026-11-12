-- The funding organizations of an event created from a course session follow
-- the course of that session, like its speakers and location (see
-- 1791600000007_sync_public_event_speakers). They are only edited on the
-- course; the event shows a copy.
CREATE OR REPLACE FUNCTION "public"."sync_event_funding_organizations"(p_event_course_id integer)
RETURNS void AS $$
DECLARE
  v_source_course_id integer;
BEGIN
  SELECT s."courseId" INTO v_source_course_id
  FROM "public"."Course" c
  JOIN "public"."Session" s ON s."id" = c."sourceSessionId"
  WHERE c."id" = p_event_course_id;

  IF v_source_course_id IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM "public"."CourseFundingOrganization" ef
  WHERE ef."courseId" = p_event_course_id
    AND NOT EXISTS (
      SELECT 1 FROM "public"."CourseFundingOrganization" src
      WHERE src."courseId" = v_source_course_id AND src."organizationId" = ef."organizationId"
    );

  INSERT INTO "public"."CourseFundingOrganization" ("courseId", "organizationId")
  SELECT p_event_course_id, src."organizationId"
  FROM "public"."CourseFundingOrganization" src
  WHERE src."courseId" = v_source_course_id
  ON CONFLICT ("courseId", "organizationId") DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Creating the event (or pointing it at a session) syncs the funding
-- organizations too.
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
  PERFORM "public"."sync_event_funding_organizations"(NEW."id");

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Later changes on the course flow into all events created from its sessions.
CREATE OR REPLACE FUNCTION "public"."sync_CourseFundingOrganization_to_public_event"()
RETURNS TRIGGER AS $$
DECLARE
  v_event_course_id integer;
BEGIN
  FOR v_event_course_id IN
    SELECT c."id" FROM "public"."Course" c
    JOIN "public"."Session" s ON s."id" = c."sourceSessionId"
    WHERE s."courseId" IN (
      CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE NEW."courseId" END,
      CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD."courseId" END
    )
  LOOP
    PERFORM "public"."sync_event_funding_organizations"(v_event_course_id);
  END LOOP;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "sync_CourseFundingOrganization_to_public_event"
AFTER INSERT OR UPDATE OR DELETE ON "public"."CourseFundingOrganization"
FOR EACH ROW EXECUTE FUNCTION "public"."sync_CourseFundingOrganization_to_public_event"();

-- Bring events created before this migration in line with their courses.
SELECT "public"."sync_event_funding_organizations"("id")
FROM "public"."Course"
WHERE "sourceSessionId" IS NOT NULL;
