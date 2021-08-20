CREATE TABLE "public"."Mail" ("Id" serial NOT NULL, "Subject" text NOT NULL, "Content" text NOT NULL, "To" text NOT NULL, "From" text NOT NULL, "CC" text NOT NULL, "BCC" text NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "Sender_id" integer NOT NULL, PRIMARY KEY ("Id") , FOREIGN KEY ("Sender_id") REFERENCES "public"."Person"("Id") ON UPDATE restrict ON DELETE restrict);
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
CREATE TRIGGER "set_public_Mail_updated_at"
BEFORE UPDATE ON "public"."Mail"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_Mail_updated_at" ON "public"."Mail" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
