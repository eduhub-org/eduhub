CREATE TABLE "public"."CourseGroup" ("id" serial NOT NULL, "courseId" integer NOT NULL, "groupOptionId" integer NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , UNIQUE ("id"));COMMENT ON TABLE "public"."CourseGroup" IS E'Assigns the courses to one or more of the given groups.';
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
CREATE TRIGGER "set_public_CourseGroup_updated_at"
BEFORE UPDATE ON "public"."CourseGroup"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_CourseGroup_updated_at" ON "public"."CourseGroup" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
