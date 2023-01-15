CREATE TABLE "public"."TopicTag" ("id" serial NOT NULL, "courseViewPosition" integer NOT NULL, "title" text NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , UNIQUE ("id"), UNIQUE ("title"));COMMENT ON TABLE "public"."TopicTag" IS E'Tags to group courses or other elements according to topics and the position inwhich the corresponding group will be displayed in a view.';
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
CREATE TRIGGER "set_public_TopicTag_updated_at"
BEFORE UPDATE ON "public"."TopicTag"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_TopicTag_updated_at" ON "public"."TopicTag" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
