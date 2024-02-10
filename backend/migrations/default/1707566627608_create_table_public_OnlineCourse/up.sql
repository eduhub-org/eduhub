CREATE TABLE "public"."OnlineCourse" ("id" serial NOT NULL, "title" text NOT NULL, "short_description" text, "cover_image" text, "description_field1" text, "description_field2" text, "published" boolean, "updated_at" timestamptz NOT NULL DEFAULT now(), "created_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , UNIQUE ("id"));
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
CREATE TRIGGER "set_public_OnlineCourse_updated_at"
BEFORE UPDATE ON "public"."OnlineCourse"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_OnlineCourse_updated_at" ON "public"."OnlineCourse" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
