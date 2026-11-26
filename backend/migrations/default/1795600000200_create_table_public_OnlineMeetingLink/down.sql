-- Moves the links back into the public address columns. This re-opens the gap
-- the up migration closed: anonymous can read those columns again.

DROP TRIGGER IF EXISTS "sync_OnlineMeetingLink_to_public_event" ON "public"."OnlineMeetingLink";
DROP FUNCTION IF EXISTS "public"."sync_OnlineMeetingLink_to_public_event"();

DROP TRIGGER IF EXISTS "delete_SessionAddress_online_link" ON "public"."SessionAddress";
DROP FUNCTION IF EXISTS "public"."delete_SessionAddress_online_link"();
DROP TRIGGER IF EXISTS "sync_CourseLocation_online_change" ON "public"."CourseLocation";
DROP FUNCTION IF EXISTS "public"."sync_CourseLocation_online_change"();
DROP TRIGGER IF EXISTS "move_SessionAddress_online_address" ON "public"."SessionAddress";
DROP FUNCTION IF EXISTS "public"."move_SessionAddress_online_address"();
DROP TRIGGER IF EXISTS "move_CourseLocation_online_address" ON "public"."CourseLocation";
DROP FUNCTION IF EXISTS "public"."move_CourseLocation_online_address"();

ALTER TABLE "public"."SessionAddress" DISABLE TRIGGER "sync_SessionAddress_to_public_event";

UPDATE "public"."CourseLocation" cl
SET "defaultSessionAddress" = l."url"
FROM "public"."OnlineMeetingLink" l
WHERE l."courseLocationId" = cl."id";

UPDATE "public"."SessionAddress" sa
SET "address" = l."url"
FROM "public"."OnlineMeetingLink" l
WHERE l."sessionAddressId" = sa."id";

ALTER TABLE "public"."SessionAddress" ENABLE TRIGGER "sync_SessionAddress_to_public_event";

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

DROP TABLE IF EXISTS "public"."OnlineMeetingLink";
