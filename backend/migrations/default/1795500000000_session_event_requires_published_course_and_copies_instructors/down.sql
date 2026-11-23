-- Organizers copied by up.sql stay: they are ordinary CourseInstructor rows now.

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

DROP FUNCTION IF EXISTS "public"."copy_event_organizers_from_source_course"(integer);

CREATE OR REPLACE FUNCTION "public"."check_Course_sourceSessionId"()
RETURNS TRIGGER AS $$
DECLARE
  v_source_course_id integer;
  v_source_course_source integer;
  v_source_org integer;
  v_target_org integer;
  v_target_type text;
BEGIN
  IF NEW."sourceSessionId" IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT c."id", c."sourceSessionId", p."organizationId"
    INTO v_source_course_id, v_source_course_source, v_source_org
  FROM "public"."Session" s
  JOIN "public"."Course" c ON c."id" = s."courseId"
  JOIN "public"."Program" p ON p."id" = c."programId"
  WHERE s."id" = NEW."sourceSessionId";

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session % is not a course session', NEW."sourceSessionId";
  END IF;

  IF v_source_course_id = NEW."id" THEN
    RAISE EXCEPTION 'A course cannot be the public event of its own session';
  END IF;

  IF v_source_course_source IS NOT NULL THEN
    RAISE EXCEPTION 'Session % belongs to an event that was itself created from a session', NEW."sourceSessionId";
  END IF;

  SELECT p."organizationId", p."type" INTO v_target_org, v_target_type
  FROM "public"."Program" p WHERE p."id" = NEW."programId";

  IF v_target_type IS DISTINCT FROM 'EVENTS' THEN
    RAISE EXCEPTION 'An event created from a session must belong to an events program';
  END IF;

  IF v_target_org IS DISTINCT FROM v_source_org THEN
    RAISE EXCEPTION 'The events program must belong to the organization of the session''s course';
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW."registrationType" := 'DIRECT_CONFIRMATION';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
