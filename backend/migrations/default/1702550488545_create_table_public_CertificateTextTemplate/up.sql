CREATE TABLE "public"."CertificateTextTemplate" ("id" serial NOT NULL, "title" text NOT NULL, "html" text NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , UNIQUE ("id"), UNIQUE ("title"));COMMENT ON TABLE "public"."CertificateTextTemplate" IS E'Certificate text templates is the basis for the textual content that is dynamically generated according to the course, user enrollment data, and certificate type.';
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
CREATE TRIGGER "set_public_CertificateTextTemplate_updated_at"
BEFORE UPDATE ON "public"."CertificateTextTemplate"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_CertificateTextTemplate_updated_at" ON "public"."CertificateTextTemplate" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
