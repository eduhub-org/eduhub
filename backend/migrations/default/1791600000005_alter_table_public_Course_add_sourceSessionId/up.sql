-- A single session of a course can be opened to the public as an event. The
-- event is an ordinary course in an EVENTS program (so registration, guest
-- signup, mails, feeds and capacity all work unchanged); this column links it
-- back to the course session it was created from.
ALTER TABLE "public"."Course" ADD COLUMN "sourceSessionId" integer NULL;

ALTER TABLE "public"."Course"
  ADD CONSTRAINT "Course_sourceSessionId_fkey"
  FOREIGN KEY ("sourceSessionId") REFERENCES "public"."Session"("id")
  ON UPDATE CASCADE ON DELETE SET NULL;

-- One public event per session.
ALTER TABLE "public"."Course"
  ADD CONSTRAINT "Course_sourceSessionId_key" UNIQUE ("sourceSessionId");

COMMENT ON COLUMN "public"."Course"."sourceSessionId" IS 'Set on an event created from a course session; its session, locations and addresses are kept in sync with that session';

-- The source must be a course session of the same organization, the event
-- must live in an EVENTS program, and an event cannot itself be the source of
-- another event (which would chain the sync). A new event starts with direct
-- registration.
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

  -- Anyone may sign up for a session opened to the public, so the event starts
  -- with direct registration. Org admins cannot set the registration type
  -- themselves, and the column default (approval) would defeat the purpose.
  IF TG_OP = 'INSERT' THEN
    NEW."registrationType" := 'DIRECT_CONFIRMATION';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "check_Course_sourceSessionId"
BEFORE INSERT OR UPDATE OF "sourceSessionId", "programId" ON "public"."Course"
FOR EACH ROW EXECUTE FUNCTION "public"."check_Course_sourceSessionId"();

-- Title, description and timing of the event's session follow the source
-- session. Creates the session when the event has none (first sync, or an
-- admin deleted it).
CREATE OR REPLACE FUNCTION "public"."sync_event_session_fields"(p_event_course_id integer)
RETURNS void AS $$
DECLARE
  src "public"."Session"%ROWTYPE;
BEGIN
  SELECT s.* INTO src
  FROM "public"."Session" s
  JOIN "public"."Course" c ON c."sourceSessionId" = s."id"
  WHERE c."id" = p_event_course_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM "public"."Session" WHERE "courseId" = p_event_course_id) THEN
    INSERT INTO "public"."Session" ("courseId", "title", "description", "startDateTime", "endDateTime", "isMandatory")
    VALUES (p_event_course_id, src."title", src."description", src."startDateTime", src."endDateTime", true);
    RETURN;
  END IF;

  UPDATE "public"."Session" s
  SET "title" = src."title",
      "description" = src."description",
      "startDateTime" = src."startDateTime",
      "endDateTime" = src."endDateTime"
  WHERE s."courseId" = p_event_course_id
    AND (s."title", s."description", s."startDateTime", s."endDateTime")
        IS DISTINCT FROM (src."title", src."description", src."startDateTime", src."endDateTime");
END;
$$ LANGUAGE plpgsql;

-- The source session's addresses with the location option each stands for.
CREATE OR REPLACE FUNCTION "public"."event_source_session_addresses"(p_session_id integer)
RETURNS TABLE ("opt" text, "address" text, "locationAddressId" integer, "sourceId" integer) AS $$
  SELECT COALESCE(sa."locationOption", cl."locationOption"), sa."address", sa."locationAddressId", sa."id"
  FROM "public"."SessionAddress" sa
  LEFT JOIN "public"."CourseLocation" cl ON cl."id" = sa."courseLocationId"
  WHERE sa."sessionId" = p_session_id
    AND COALESCE(sa."locationOption", cl."locationOption") IS NOT NULL;
$$ LANGUAGE sql STABLE;

-- Rebuilds the event's locations and session addresses from the source
-- session's addresses. A course session address takes its location option
-- from its CourseLocation, so the event gets one CourseLocation per option and
-- its session addresses point at those.
CREATE OR REPLACE FUNCTION "public"."sync_event_session_locations"(p_event_course_id integer)
RETURNS void AS $$
DECLARE
  v_source_session_id integer;
BEGIN
  SELECT "sourceSessionId" INTO v_source_session_id
  FROM "public"."Course" WHERE "id" = p_event_course_id;

  IF v_source_session_id IS NULL THEN
    RETURN;
  END IF;

  -- Start from scratch: the source may have gained or lost a location.
  DELETE FROM "public"."SessionAddress" sa
  USING "public"."Session" s
  WHERE sa."sessionId" = s."id" AND s."courseId" = p_event_course_id;
  DELETE FROM "public"."CourseLocation" WHERE "courseId" = p_event_course_id;

  INSERT INTO "public"."CourseLocation" ("courseId", "locationOption", "defaultSessionAddress", "defaultSessionAddressId")
  SELECT DISTINCT ON (a."opt") p_event_course_id, a."opt", a."address", a."locationAddressId"
  FROM "public"."event_source_session_addresses"(v_source_session_id) a
  ORDER BY a."opt", a."sourceId";

  INSERT INTO "public"."SessionAddress" ("sessionId", "courseLocationId", "address", "locationAddressId")
  SELECT s."id", cl."id", a."address", a."locationAddressId"
  FROM "public"."Session" s
  JOIN "public"."CourseLocation" cl ON cl."courseId" = p_event_course_id
  JOIN "public"."event_source_session_addresses"(v_source_session_id) a ON a."opt" = cl."locationOption"
  WHERE s."courseId" = p_event_course_id;
END;
$$ LANGUAGE plpgsql;

-- Creating the event (or pointing it at a session) copies the session over.
-- Speakers are only copied on creation: afterwards the event's speakers are
-- managed on the event, since the speaker-added mail goes out per course.
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

  IF TG_OP = 'INSERT' THEN
    INSERT INTO "public"."SessionSpeaker" ("sessionId", "userId")
    SELECT es."id", ss."userId"
    FROM "public"."SessionSpeaker" ss
    CROSS JOIN "public"."Session" es
    WHERE ss."sessionId" = NEW."sourceSessionId" AND es."courseId" = NEW."id";
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "init_Course_from_sourceSession"
AFTER INSERT OR UPDATE OF "sourceSessionId" ON "public"."Course"
FOR EACH ROW EXECUTE FUNCTION "public"."init_Course_from_sourceSession"();

-- Later edits to the source session flow into its event (one direction only).
CREATE OR REPLACE FUNCTION "public"."sync_Session_to_public_event"()
RETURNS TRIGGER AS $$
DECLARE
  v_event_course_id integer;
BEGIN
  SELECT "id" INTO v_event_course_id FROM "public"."Course" WHERE "sourceSessionId" = NEW."id";
  IF v_event_course_id IS NOT NULL THEN
    PERFORM "public"."sync_event_session_fields"(v_event_course_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "sync_Session_to_public_event"
AFTER UPDATE OF "title", "description", "startDateTime", "endDateTime" ON "public"."Session"
FOR EACH ROW EXECUTE FUNCTION "public"."sync_Session_to_public_event"();

CREATE OR REPLACE FUNCTION "public"."sync_SessionAddress_to_public_event"()
RETURNS TRIGGER AS $$
DECLARE
  v_event_course_id integer;
BEGIN
  FOR v_event_course_id IN
    SELECT c."id" FROM "public"."Course" c
    WHERE c."sourceSessionId" IN (
      CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE NEW."sessionId" END,
      CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD."sessionId" END
    )
  LOOP
    PERFORM "public"."sync_event_session_locations"(v_event_course_id);
  END LOOP;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "sync_SessionAddress_to_public_event"
AFTER INSERT OR UPDATE OR DELETE ON "public"."SessionAddress"
FOR EACH ROW EXECUTE FUNCTION "public"."sync_SessionAddress_to_public_event"();
