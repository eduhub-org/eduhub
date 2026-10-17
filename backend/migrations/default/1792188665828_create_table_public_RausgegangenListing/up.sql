-- Event categories of the Rausgegangen API, as ALL_CAPS GraphQL enum names
-- (AKTIV_UND_KREATIV -> "aktiv-und-kreativ" in the API).
CREATE TABLE "public"."RausgegangenEventCategory" (
  "value"   text NOT NULL,
  "comment" text NOT NULL,
  PRIMARY KEY ("value")
);

COMMENT ON TABLE "public"."RausgegangenEventCategory" IS E'Event categories of rausgegangen.de';

INSERT INTO "public"."RausgegangenEventCategory" ("value", "comment") VALUES
  ('AKTIV_UND_KREATIV', 'Aktiv & kreativ (workshops)'),
  ('AUSSTELLUNG', 'Ausstellung'),
  ('FESTE_UND_FESTIVAL', 'Feste & Festival'),
  ('FILM', 'Film'),
  ('FOOD_UND_DRINKS', 'Food & Drinks'),
  ('GESPROCHENES', 'Gesprochenes (talks, lectures, readings)'),
  ('KINDER_UND_FAMILIEN', 'Kinder & Familien'),
  ('KONZERTE_UND_MUSIK', 'Konzerte & Musik'),
  ('MARKT', 'Markt'),
  ('PARTY', 'Party'),
  ('SHOWS_UND_PERFORMANCES', 'Shows & Performances'),
  ('SPORT', 'Sport'),
  ('THEATER', 'Theater');

-- One row per event that is (or was) shared on rausgegangen.de. The editor sets
-- enabled/category/tags; the sync function alone writes the remaining columns.
CREATE TABLE "public"."RausgegangenListing" (
  "id"                  serial      NOT NULL,
  "courseId"            integer     NOT NULL,
  "enabled"             boolean     NOT NULL DEFAULT false,
  "category"            text        NOT NULL DEFAULT 'GESPROCHENES',
  "tags"                jsonb       NOT NULL DEFAULT '[]'::jsonb,
  "rausgegangenEventId" text        NULL,
  "rausgegangenShowId"  text        NULL,
  "previewUrl"          text        NULL,
  "publicUrl"           text        NULL,
  "published"           boolean     NOT NULL DEFAULT false,
  "syncStatus"          text        NOT NULL DEFAULT 'PENDING',
  "syncError"           text        NULL,
  "lastSyncedAt"        timestamptz NULL,
  "created_at"          timestamptz NOT NULL DEFAULT now(),
  "updated_at"          timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "RausgegangenListing_courseId_key" UNIQUE ("courseId"),
  CONSTRAINT "RausgegangenListing_syncStatus_check"
    CHECK ("syncStatus" IN ('PENDING', 'SYNCED', 'ERROR', 'SKIPPED')),
  CONSTRAINT "RausgegangenListing_tags_check"
    CHECK (jsonb_typeof("tags") = 'array' AND jsonb_array_length("tags") <= 12)
);

COMMENT ON TABLE "public"."RausgegangenListing" IS E'An event shared on rausgegangen.de, with the state of its last sync';
COMMENT ON COLUMN "public"."RausgegangenListing"."published" IS 'Whether the last sync sent the event as published (false in test mode and outside production)';

ALTER TABLE "public"."RausgegangenListing"
  ADD CONSTRAINT "RausgegangenListing_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id")
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."RausgegangenListing"
  ADD CONSTRAINT "RausgegangenListing_category_fkey"
  FOREIGN KEY ("category") REFERENCES "public"."RausgegangenEventCategory"("value")
  ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE TRIGGER "set_public_RausgegangenListing_updated_at"
BEFORE UPDATE ON "public"."RausgegangenListing"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();

-- Only events are shared: the course must belong to an EVENTS program.
CREATE OR REPLACE FUNCTION "public"."check_RausgegangenListing_course"()
RETURNS TRIGGER AS $$
DECLARE
  v_type text;
BEGIN
  SELECT p."type" INTO v_type
  FROM "public"."Course" c
  JOIN "public"."Program" p ON p."id" = c."programId"
  WHERE c."id" = NEW."courseId";

  IF v_type IS DISTINCT FROM 'EVENTS' THEN
    RAISE EXCEPTION 'Only courses of an events program can be shared on Rausgegangen';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "check_RausgegangenListing_course"
BEFORE INSERT OR UPDATE OF "courseId" ON "public"."RausgegangenListing"
FOR EACH ROW EXECUTE FUNCTION "public"."check_RausgegangenListing_course"();
