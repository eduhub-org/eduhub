CREATE TABLE "public"."Project" ("title" text NOT NULL, "short_description" text NOT NULL, "cover_image" text NOT NULL, "description_field1" text NOT NULL, "description_field2" text NOT NULL, "published" boolean NOT NULL, "updated_at" timestamptz NOT NULL DEFAULT now(), "created_at" timestamptz NOT NULL DEFAULT now(), "id" serial NOT NULL, PRIMARY KEY ("id") , UNIQUE ("id"));COMMENT ON TABLE "public"."Project" IS E'Information on available projects that can be conducted and, e.g., serve as an option for an achievement record.';
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
CREATE TRIGGER "set_public_Project_updated_at"
BEFORE UPDATE ON "public"."Project"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_Project_updated_at" ON "public"."Project" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
