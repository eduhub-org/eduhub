-- Venue categories: the categories of the Rausgegangen location API, as
-- ALL_CAPS GraphQL enum names (BAR -> "bar" in the API); they describe a venue
-- in general too.
CREATE TABLE "public"."LocationAddressCategory" (
  "value"   text NOT NULL,
  "comment" text NOT NULL,
  PRIMARY KEY ("value")
);

COMMENT ON TABLE "public"."LocationAddressCategory" IS E'Kind of venue of a location address';

INSERT INTO "public"."LocationAddressCategory" ("value", "comment") VALUES
  ('BAR', 'Bar'),
  ('CLUB', 'Club'),
  ('CAFE', 'Café'),
  ('RESTAURANT', 'Restaurant'),
  ('VENUE', 'Event venue'),
  ('CONCERT', 'Concert hall'),
  ('THEATER', 'Theater'),
  ('CINEMA', 'Cinema'),
  ('GALLERY', 'Gallery'),
  ('MUSEUM', 'Museum'),
  ('WORKSPACE', 'Workspace / coworking'),
  ('SHOWROOM', 'Showroom'),
  ('OPENAIR', 'Open air'),
  ('PUBLICSPACE', 'Public space'),
  ('MISC', 'Other'),
  ('ZIRKUS', 'Circus'),
  ('SPORTS', 'Sports venue'),
  ('MARKET', 'Market'),
  ('STORE', 'Store');

-- "address" stays the free-text display string used by feeds and the UI. The
-- structured columns below are what geocoding, maps and external event
-- platforms need.
ALTER TABLE "public"."LocationAddress"
  ADD COLUMN "street" text NULL,
  ADD COLUMN "zipCode" text NULL,
  ADD COLUMN "city" text NULL,
  ADD COLUMN "country" text NULL DEFAULT 'Deutschland',
  ADD COLUMN "addressAdditionalInfo" text NULL,
  ADD COLUMN "directions" text NULL,
  ADD COLUMN "accessibilityInfo" text NULL,
  ADD COLUMN "latitude" numeric(9, 6) NULL,
  ADD COLUMN "longitude" numeric(9, 6) NULL,
  ADD COLUMN "category" text NULL,
  ADD COLUMN "image" text NULL,
  ADD COLUMN "imageCredits" text NULL,
  ADD COLUMN "websiteUrl" text NULL,
  ADD COLUMN "publicEmail" text NULL,
  ADD COLUMN "publicPhone" text NULL,
  ADD COLUMN "instagramUrl" text NULL,
  ADD COLUMN "rausgegangenLocationId" text NULL,
  ADD COLUMN "rausgegangenLocationOwned" boolean NOT NULL DEFAULT false;

ALTER TABLE "public"."LocationAddress"
  ADD CONSTRAINT "LocationAddress_category_fkey"
  FOREIGN KEY ("category") REFERENCES "public"."LocationAddressCategory"("value")
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "public"."LocationAddress"
  ADD CONSTRAINT "LocationAddress_rausgegangenLocationId_key" UNIQUE ("rausgegangenLocationId");

ALTER TABLE "public"."LocationAddress"
  ADD CONSTRAINT "LocationAddress_latitude_check" CHECK ("latitude" BETWEEN -90 AND 90),
  ADD CONSTRAINT "LocationAddress_longitude_check" CHECK ("longitude" BETWEEN -180 AND 180),
  ADD CONSTRAINT "LocationAddress_imageCredits_length" CHECK (char_length("imageCredits") <= 120);

COMMENT ON COLUMN "public"."LocationAddress"."street" IS 'Street and house number';
COMMENT ON COLUMN "public"."LocationAddress"."rausgegangenLocationId" IS 'UUID of the matching location on rausgegangen.de, linked or created by the event sync';
COMMENT ON COLUMN "public"."LocationAddress"."rausgegangenLocationOwned" IS 'True when the event sync created the Rausgegangen location (and keeps it updated); false when it links a location owned by someone else';

-- Best-effort backfill from the free-text address.
-- "Street 1, 24103 Kiel" -> street, zip and city.
UPDATE "public"."LocationAddress"
SET "street"  = trim(m[1]),
    "zipCode" = m[2],
    "city"    = trim(m[3])
FROM (
  SELECT id, regexp_match(replace("address", E'\n', ', '), '([^,]+),\s*(\d{5})\s+([^,]+)') AS m
  FROM "public"."LocationAddress"
) parsed
WHERE parsed.id = "LocationAddress".id
  AND parsed.m IS NOT NULL;

-- "Street 1" (single line, no zip) -> street only.
UPDATE "public"."LocationAddress"
SET "street" = trim("address")
WHERE "street" IS NULL
  AND "locationOption" <> 'ONLINE'
  AND "address" !~ '\d{5}'
  AND "address" !~ '[\n,]'
  AND "address" ~ '\d';

-- The city of an in-person location option.
UPDATE "public"."LocationAddress"
SET "city" = CASE "locationOption"
               WHEN 'KIEL' THEN 'Kiel'
               WHEN 'HEIDE' THEN 'Heide'
               WHEN 'HAMBURG' THEN 'Hamburg'
             END
WHERE "city" IS NULL
  AND "locationOption" IN ('KIEL', 'HEIDE', 'HAMBURG');

UPDATE "public"."LocationAddress"
SET "country" = NULL
WHERE "locationOption" = 'ONLINE';
