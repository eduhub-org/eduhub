CREATE TABLE "public"."AchievementOptionCourse" ("id" serial NOT NULL, "achievementOptionId" integer NOT NULL, "courseId" integer NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , UNIQUE ("id"));COMMENT ON TABLE "public"."AchievementOptionCourse" IS E'A new row is added when an achievement option is added to a course by the respective course instructor or an admin.';
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
CREATE TRIGGER "set_public_AchievementOptionCourse_updated_at"
BEFORE UPDATE ON "public"."AchievementOptionCourse"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_AchievementOptionCourse_updated_at" ON "public"."AchievementOptionCourse" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
