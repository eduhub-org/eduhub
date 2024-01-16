CREATE TABLE "public"."AchievementDocumentationTemplate" ("id" serial NOT NULL, "title" text NOT NULL, "url" text NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , UNIQUE ("id"));COMMENT ON TABLE "public"."AchievementDocumentationTemplate" IS E'Contains Templates to be used by course participants to complete their achievements';
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
CREATE TRIGGER "set_public_AchievementDocumentationTemplate_updated_at"
BEFORE UPDATE ON "public"."AchievementDocumentationTemplate"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_AchievementDocumentationTemplate_updated_at" ON "public"."AchievementDocumentationTemplate" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
