-- Online meeting links move out of the public address columns.
--
-- SessionAddress.address and CourseLocation.defaultSessionAddress hold venue
-- addresses for physical locations and the meeting link for ONLINE ones. The
-- anonymous role (inherited by user and instructor) reads both columns for
-- every row, so any API client could fetch every meeting link. The links now
-- live in OnlineMeetingLink, whose row filters only let confirmed participants,
-- instructors, organization admins with a matching grant and admins read them.

CREATE TABLE "public"."OnlineMeetingLink" (
  "id"               serial      NOT NULL,
  "url"              text        NOT NULL,
  "courseLocationId" integer     NULL,
  "sessionAddressId" integer     NULL,
  "created_at"       timestamptz NOT NULL DEFAULT now(),
  "updated_at"       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "OnlineMeetingLink_courseLocationId_key" UNIQUE ("courseLocationId"),
  CONSTRAINT "OnlineMeetingLink_sessionAddressId_key" UNIQUE ("sessionAddressId"),
  CONSTRAINT "OnlineMeetingLink_one_owner"
    CHECK (num_nonnulls("courseLocationId", "sessionAddressId") = 1)
);

COMMENT ON TABLE "public"."OnlineMeetingLink" IS E'Meeting link of an ONLINE course location (the default for its sessions) or of one session address. Readable only by confirmed participants, instructors and managing organization admins.';

ALTER TABLE "public"."OnlineMeetingLink"
  ADD CONSTRAINT "OnlineMeetingLink_courseLocationId_fkey"
  FOREIGN KEY ("courseLocationId") REFERENCES "public"."CourseLocation"("id")
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."OnlineMeetingLink"
  ADD CONSTRAINT "OnlineMeetingLink_sessionAddressId_fkey"
  FOREIGN KEY ("sessionAddressId") REFERENCES "public"."SessionAddress"("id")
  ON UPDATE CASCADE ON DELETE CASCADE;

CREATE TRIGGER "set_public_OnlineMeetingLink_updated_at"
BEFORE UPDATE ON "public"."OnlineMeetingLink"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();

-- Move the existing links.
INSERT INTO "public"."OnlineMeetingLink" ("courseLocationId", "url")
SELECT cl."id", btrim(cl."defaultSessionAddress")
FROM "public"."CourseLocation" cl
WHERE cl."locationOption" = 'ONLINE'
  AND btrim(COALESCE(cl."defaultSessionAddress", '')) <> '';

INSERT INTO "public"."OnlineMeetingLink" ("sessionAddressId", "url")
SELECT sa."id", btrim(sa."address")
FROM "public"."SessionAddress" sa
LEFT JOIN "public"."CourseLocation" cl ON cl."id" = sa."courseLocationId"
WHERE COALESCE(sa."locationOption", cl."locationOption") = 'ONLINE'
  AND btrim(sa."address") <> '';

-- Session events already hold copies of their source's links, which were moved
-- above like any other; resyncing them row by row here would only churn them.
ALTER TABLE "public"."SessionAddress" DISABLE TRIGGER "sync_SessionAddress_to_public_event";

UPDATE "public"."CourseLocation"
SET "defaultSessionAddress" = NULL
WHERE "locationOption" = 'ONLINE' AND "defaultSessionAddress" IS NOT NULL;

UPDATE "public"."SessionAddress"
SET "address" = ''
WHERE "id" IN (SELECT "sessionAddressId" FROM "public"."OnlineMeetingLink");

ALTER TABLE "public"."SessionAddress" ENABLE TRIGGER "sync_SessionAddress_to_public_event";

-- Keep links out of the public columns from now on. Whoever still writes a link
-- into them (an older client, the MCP course tools, a copy) has it moved into
-- OnlineMeetingLink in the same transaction. Text a location carries over
-- unchanged while it switches to ONLINE is a legacy street address, not a
-- link, and is dropped; text written in that same update is a link and moves.
CREATE OR REPLACE FUNCTION "public"."move_CourseLocation_online_address"()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT'
     OR OLD."locationOption" IS NOT DISTINCT FROM 'ONLINE'
     OR NEW."defaultSessionAddress" IS DISTINCT FROM OLD."defaultSessionAddress" THEN
    INSERT INTO "public"."OnlineMeetingLink" ("courseLocationId", "url")
    VALUES (NEW."id", btrim(NEW."defaultSessionAddress"))
    ON CONFLICT ("courseLocationId") DO UPDATE SET "url" = EXCLUDED."url";
  END IF;
  UPDATE "public"."CourseLocation" SET "defaultSessionAddress" = NULL WHERE "id" = NEW."id";
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "move_CourseLocation_online_address"
AFTER INSERT OR UPDATE OF "defaultSessionAddress", "locationOption" ON "public"."CourseLocation"
FOR EACH ROW
WHEN (NEW."locationOption" = 'ONLINE' AND btrim(COALESCE(NEW."defaultSessionAddress", '')) <> '')
EXECUTE PROCEDURE "public"."move_CourseLocation_online_address"();

CREATE OR REPLACE FUNCTION "public"."move_SessionAddress_online_address"()
RETURNS TRIGGER AS $$
DECLARE
  v_course_option text;
BEGIN
  SELECT cl."locationOption" INTO v_course_option
  FROM "public"."CourseLocation" cl WHERE cl."id" = NEW."courseLocationId";

  IF COALESCE(NEW."locationOption", v_course_option) IS DISTINCT FROM 'ONLINE' THEN
    RETURN NULL;
  END IF;

  -- A program session address switching to ONLINE keeps no legacy text,
  -- unless the same update wrote new text: that is the link.
  IF TG_OP = 'INSERT'
     OR NEW."courseLocationId" IS NOT NULL
     OR OLD."locationOption" IS NOT DISTINCT FROM 'ONLINE'
     OR NEW."address" IS DISTINCT FROM OLD."address" THEN
    INSERT INTO "public"."OnlineMeetingLink" ("sessionAddressId", "url")
    VALUES (NEW."id", btrim(NEW."address"))
    ON CONFLICT ("sessionAddressId") DO UPDATE SET "url" = EXCLUDED."url";
  END IF;
  UPDATE "public"."SessionAddress" SET "address" = '' WHERE "id" = NEW."id";
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "move_SessionAddress_online_address"
AFTER INSERT OR UPDATE OF "address", "locationOption", "courseLocationId" ON "public"."SessionAddress"
FOR EACH ROW
WHEN (btrim(NEW."address") <> '')
EXECUTE PROCEDURE "public"."move_SessionAddress_online_address"();

-- A course location switching to ONLINE drops its sessions' legacy free text;
-- one switching away from ONLINE drops its links, which belonged to the old option.
CREATE OR REPLACE FUNCTION "public"."sync_CourseLocation_online_change"()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."locationOption" = 'ONLINE' THEN
    UPDATE "public"."SessionAddress"
    SET "address" = ''
    WHERE "courseLocationId" = NEW."id" AND "address" <> '';
  ELSE
    DELETE FROM "public"."OnlineMeetingLink"
    WHERE "courseLocationId" = NEW."id"
       OR "sessionAddressId" IN (
         SELECT "id" FROM "public"."SessionAddress" WHERE "courseLocationId" = NEW."id"
       );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "sync_CourseLocation_online_change"
AFTER UPDATE OF "locationOption" ON "public"."CourseLocation"
FOR EACH ROW
WHEN (OLD."locationOption" IS DISTINCT FROM NEW."locationOption")
EXECUTE PROCEDURE "public"."sync_CourseLocation_online_change"();

-- A program session address switching away from ONLINE drops its link.
CREATE OR REPLACE FUNCTION "public"."delete_SessionAddress_online_link"()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM "public"."OnlineMeetingLink" WHERE "sessionAddressId" = NEW."id";
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "delete_SessionAddress_online_link"
AFTER UPDATE OF "locationOption" ON "public"."SessionAddress"
FOR EACH ROW
WHEN (OLD."locationOption" = 'ONLINE' AND NEW."locationOption" IS DISTINCT FROM 'ONLINE')
EXECUTE PROCEDURE "public"."delete_SessionAddress_online_link"();

-- Session events copy their source session's locations. Only the session's own
-- link is copied (as the event location's default link), never the source
-- course's default: that one opens every session of the source course, while an
-- event is open to anyone who registers for it. Address text of an ONLINE source
-- is never copied, so a link that is still being moved out of a source
-- address (the move trigger syncs events mid-way) cannot reach the event twice.
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
  SELECT DISTINCT ON (a."opt") p_event_course_id, a."opt",
    CASE WHEN a."opt" = 'ONLINE' THEN NULL ELSE a."address" END, a."locationAddressId"
  FROM "public"."event_source_session_addresses"(v_source_session_id) a
  ORDER BY a."opt", a."sourceId";

  INSERT INTO "public"."SessionAddress" ("sessionId", "courseLocationId", "address", "locationAddressId")
  SELECT s."id", cl."id", CASE WHEN a."opt" = 'ONLINE' THEN '' ELSE a."address" END, a."locationAddressId"
  FROM "public"."Session" s
  JOIN "public"."CourseLocation" cl ON cl."courseId" = p_event_course_id
  JOIN "public"."event_source_session_addresses"(v_source_session_id) a ON a."opt" = cl."locationOption"
  WHERE s."courseId" = p_event_course_id;

  INSERT INTO "public"."OnlineMeetingLink" ("courseLocationId", "url")
  SELECT cl."id", src."url"
  FROM "public"."CourseLocation" cl
  CROSS JOIN LATERAL (
    SELECT btrim(sal."url") AS "url"
    FROM "public"."event_source_session_addresses"(v_source_session_id) a
    JOIN "public"."SessionAddress" sa ON sa."id" = a."sourceId"
    JOIN "public"."OnlineMeetingLink" sal ON sal."sessionAddressId" = sa."id"
    WHERE a."opt" = 'ONLINE'
      AND btrim(sal."url") <> ''
    ORDER BY a."sourceId"
    LIMIT 1
  ) src
  WHERE cl."courseId" = p_event_course_id AND cl."locationOption" = 'ONLINE'
  ON CONFLICT ("courseLocationId") DO UPDATE SET "url" = EXCLUDED."url";
END;
$$ LANGUAGE plpgsql;

-- A changed link of a source session reaches its session events too. Course
-- default links never reach events (see above), so only session links count.
CREATE OR REPLACE FUNCTION "public"."sync_OnlineMeetingLink_to_public_event"()
RETURNS TRIGGER AS $$
DECLARE
  v_row "public"."OnlineMeetingLink";
  v_event_course_id integer;
BEGIN
  v_row := CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  FOR v_event_course_id IN
    SELECT DISTINCT c."id"
    FROM "public"."Course" c
    JOIN "public"."Session" s ON s."id" = c."sourceSessionId"
    WHERE s."id" IN (
      SELECT sa."sessionId" FROM "public"."SessionAddress" sa WHERE sa."id" = v_row."sessionAddressId"
    )
  LOOP
    PERFORM "public"."sync_event_session_locations"(v_event_course_id);
  END LOOP;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "sync_OnlineMeetingLink_to_public_event"
AFTER INSERT OR UPDATE OR DELETE ON "public"."OnlineMeetingLink"
FOR EACH ROW
EXECUTE PROCEDURE "public"."sync_OnlineMeetingLink_to_public_event"();
