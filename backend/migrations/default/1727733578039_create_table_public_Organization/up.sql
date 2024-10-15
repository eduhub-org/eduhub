CREATE TABLE "public"."Organization" ("id" serial NOT NULL, "name" text NOT NULL, "type" text NOT NULL, "description" text, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , UNIQUE ("id"), UNIQUE ("name"));COMMENT ON TABLE "public"."Organization" IS E'Represents organizations associated with users in the EduHub system. Includes details such as name, type, description, and aliases. Used for organizational affiliation and white-labeling functionality.';
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
CREATE TRIGGER "set_public_Organization_updated_at"
BEFORE UPDATE ON "public"."Organization"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_Organization_updated_at" ON "public"."Organization" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
