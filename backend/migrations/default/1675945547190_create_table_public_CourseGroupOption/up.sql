CREATE TABLE "public"."CourseGroupOption" ("id" serial NOT NULL, "title" text NOT NULL, "order" integer NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , UNIQUE ("id"), UNIQUE ("title"));COMMENT ON TABLE "public"."CourseGroupOption" IS E'Defines the possible groups a course can be assigned to, to use these for filtering. The provided order is used to show the groups in the respective order.';
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
CREATE TRIGGER "set_public_CourseGroupOption_updated_at"
BEFORE UPDATE ON "public"."CourseGroupOption"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_CourseGroupOption_updated_at" ON "public"."CourseGroupOption" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
