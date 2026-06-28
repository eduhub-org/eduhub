-- Durable identity for a recurring course ("all past iterations of this course").
-- A course points at its series via Course.courseSeriesId so that "projects from
-- past courses" is a single FK lookup instead of a recursive walk.
CREATE TABLE "public"."CourseSeries" (
  "id" serial NOT NULL,
  "title" text NOT NULL,
  "organizationId" integer NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("id"),
  CONSTRAINT "CourseSeries_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE SET NULL
);
COMMENT ON TABLE "public"."CourseSeries" IS E'Groups successive iterations of the same course into one durable series so past/related projects can be found via a single FK lookup.';

CREATE INDEX "CourseSeries_organizationId_idx" ON "public"."CourseSeries" ("organizationId");

CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_public_CourseSeries_updated_at"
BEFORE UPDATE ON "public"."CourseSeries"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_CourseSeries_updated_at" ON "public"."CourseSeries"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
