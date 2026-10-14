DROP TRIGGER IF EXISTS "sync_SessionSpeaker_to_public_event" ON "public"."SessionSpeaker";
DROP FUNCTION IF EXISTS "public"."sync_SessionSpeaker_to_public_event"();

-- Back to copying the speakers once, on creation.
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

DROP FUNCTION IF EXISTS "public"."sync_event_session_speakers"(integer);
