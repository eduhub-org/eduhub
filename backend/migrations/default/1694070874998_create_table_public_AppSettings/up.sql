CREATE TABLE "public"."AppSettings" ("id" serial NOT NULL, "backgroundImageURL" text NOT NULL, "previewImageURL" integer NOT NULL, "bannerTextDe" text, "bannerTextEn" text, "bannerBackgroundColor" text, "bannerFontColor" text, "updated_at" timestamptz NOT NULL DEFAULT now(), "created_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , UNIQUE ("id"));COMMENT ON TABLE "public"."AppSettings" IS E'To store characteristics on the app level.';
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
CREATE TRIGGER "set_public_AppSettings_updated_at"
BEFORE UPDATE ON "public"."AppSettings"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_AppSettings_updated_at" ON "public"."AppSettings" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
