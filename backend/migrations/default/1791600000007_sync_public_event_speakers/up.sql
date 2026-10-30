-- The speakers of an event created from a course session follow that session,
-- like its date, title, description and location (see
-- 1791600000005_alter_table_public_Course_add_sourceSessionId).
--
-- Only the difference is applied: a speaker who stays keeps their row, so the
-- speaker-added mail (an event trigger on SessionSpeaker insert) only goes out
-- for people newly listed on the event.
CREATE OR REPLACE FUNCTION "public"."sync_event_session_speakers"(p_event_course_id integer)
RETURNS void AS $$
DECLARE
  v_source_session_id integer;
BEGIN
  SELECT "sourceSessionId" INTO v_source_session_id
  FROM "public"."Course" WHERE "id" = p_event_course_id;

  IF v_source_session_id IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM "public"."SessionSpeaker" es
  USING "public"."Session" s
  WHERE es."sessionId" = s."id"
    AND s."courseId" = p_event_course_id
    AND NOT EXISTS (
      SELECT 1 FROM "public"."SessionSpeaker" src
      WHERE src."sessionId" = v_source_session_id AND src."userId" = es."userId"
    );

  INSERT INTO "public"."SessionSpeaker" ("sessionId", "userId")
  SELECT DISTINCT s."id", src."userId"
  FROM "public"."Session" s
  JOIN "public"."SessionSpeaker" src ON src."sessionId" = v_source_session_id
  WHERE s."courseId" = p_event_course_id
    AND NOT EXISTS (
      SELECT 1 FROM "public"."SessionSpeaker" es
      WHERE es."sessionId" = s."id" AND es."userId" = src."userId"
    );
END;
$$ LANGUAGE plpgsql;

-- Creating the event (or pointing it at a session) now syncs the speakers too,
-- instead of copying them once.
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

CREATE OR REPLACE FUNCTION "public"."sync_SessionSpeaker_to_public_event"()
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
    PERFORM "public"."sync_event_session_speakers"(v_event_course_id);
  END LOOP;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "sync_SessionSpeaker_to_public_event"
AFTER INSERT OR UPDATE OR DELETE ON "public"."SessionSpeaker"
FOR EACH ROW EXECUTE FUNCTION "public"."sync_SessionSpeaker_to_public_event"();

-- Bring events created before this migration in line with their sessions.
SELECT "public"."sync_event_session_speakers"("id")
FROM "public"."Course"
WHERE "sourceSessionId" IS NOT NULL;
