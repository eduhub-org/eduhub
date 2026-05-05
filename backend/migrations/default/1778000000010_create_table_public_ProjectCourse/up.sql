CREATE TABLE "public"."ProjectCourse" (
  "id" serial NOT NULL,
  "projectId" integer NOT NULL,
  "courseId" integer NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
COMMENT ON TABLE "public"."ProjectCourse" IS E'Many-to-many link between projects and courses. Mirrors AchievementOptionCourse so a single project (template or instance) can be offered or done in multiple courses.';

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
CREATE TRIGGER "set_public_ProjectCourse_updated_at"
BEFORE UPDATE ON "public"."ProjectCourse"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_ProjectCourse_updated_at" ON "public"."ProjectCourse"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
