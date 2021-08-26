CREATE TABLE "public"."SessionAddress" ("id" serial NOT NULL, "latitude" text NOT NULL, "longitude" text NOT NULL, "link" text NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "sessionId" integer NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("Id") ON UPDATE restrict ON DELETE restrict, UNIQUE ("id"));
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
CREATE TRIGGER "set_public_SessionAddress_updated_at"
BEFORE UPDATE ON "public"."SessionAddress"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_SessionAddress_updated_at" ON "public"."SessionAddress" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
