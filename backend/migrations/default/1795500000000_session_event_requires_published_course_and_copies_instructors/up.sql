-- An event created from a course session needs an organizer before it can go
-- public (1795400000000_require_instructor_for_published_course). The event is
-- its own Course row, so it gets the instructors of the session's course as
-- its organizers when it is created. And only the sessions of a published
-- course can be opened to the public: a draft course has nothing public to
-- point to yet.

-- Same checks as in 1791600000005_alter_table_public_Course_add_sourceSessionId,
-- plus: the session's course must be published when the event is created or
-- pointed at another session.
CREATE OR REPLACE FUNCTION "public"."check_Course_sourceSessionId"()
RETURNS TRIGGER AS $$
DECLARE
  v_source_course_id integer;
  v_source_course_source integer;
  v_source_course_published boolean;
  v_source_org integer;
  v_target_org integer;
  v_target_type text;
BEGIN
  IF NEW."sourceSessionId" IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT c."id", c."sourceSessionId", c."published", p."organizationId"
    INTO v_source_course_id, v_source_course_source, v_source_course_published, v_source_org
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

  -- Only checked when the link is made: unpublishing the course later leaves
  -- an existing event alone.
  IF (TG_OP = 'INSERT' OR NEW."sourceSessionId" IS DISTINCT FROM OLD."sourceSessionId")
     AND NOT COALESCE(v_source_course_published, false) THEN
    RAISE EXCEPTION 'session_event_requires_published_course'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT p."organizationId", p."type" INTO v_target_org, v_target_type
  FROM "public"."Program" p WHERE p."id" = NEW."programId";

  IF v_target_type IS DISTINCT FROM 'EVENTS' THEN
    RAISE EXCEPTION 'An event created from a session must belong to an events program';
  END IF;

  IF v_target_org IS DISTINCT FROM v_source_org THEN
    RAISE EXCEPTION 'The events program must belong to the organization of the session''s course';
  END IF;

  -- Anyone may sign up for a session opened to the public, so the event starts
  -- with direct registration. Org admins cannot set the registration type
  -- themselves, and the column default (approval) would defeat the purpose.
  IF TG_OP = 'INSERT' THEN
    NEW."registrationType" := 'DIRECT_CONFIRMATION';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- The instructors of the session's course become the event's organizers. Only
-- copied on creation, like speakers used to be: afterwards organizers are
-- managed on the event (each one gets the organizer-added mail).
CREATE OR REPLACE FUNCTION "public"."copy_event_organizers_from_source_course"(p_event_course_id integer)
RETURNS void AS $$
  INSERT INTO "public"."CourseInstructor" ("courseId", "userId")
  SELECT DISTINCT p_event_course_id, ci."userId"
  FROM "public"."Course" e
  JOIN "public"."Session" s ON s."id" = e."sourceSessionId"
  JOIN "public"."CourseInstructor" ci ON ci."courseId" = s."courseId"
  WHERE e."id" = p_event_course_id
    AND NOT EXISTS (
      SELECT 1 FROM "public"."CourseInstructor" x
      WHERE x."courseId" = p_event_course_id AND x."userId" = ci."userId"
    );
$$ LANGUAGE sql;

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

  IF TG_OP = 'INSERT' THEN
    PERFORM "public"."copy_event_organizers_from_source_course"(NEW."id");
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Draft events created before this migration have no organizer and could not
-- be published any more: give them their course's instructors too.
SELECT "public"."copy_event_organizers_from_source_course"(c."id")
FROM "public"."Course" c
WHERE c."sourceSessionId" IS NOT NULL
  AND NOT c."published"
  AND NOT EXISTS (SELECT 1 FROM "public"."CourseInstructor" ci WHERE ci."courseId" = c."id");
