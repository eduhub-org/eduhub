CREATE TABLE "public"."ProjectAuthor" (
  "id" serial NOT NULL,
  "projectId" integer NOT NULL,
  "userId" uuid NOT NULL,
  "participationStatus" text NOT NULL DEFAULT 'REQUESTED',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
COMMENT ON TABLE "public"."ProjectAuthor" IS E'Implementing author of a project. participationStatus is REQUESTED while a user has asked to join and ACCEPTED once an existing implementing author confirms. The set is fixed by the instructor or admin when the project transitions to ONGOING.';

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
CREATE TRIGGER "set_public_ProjectAuthor_updated_at"
BEFORE UPDATE ON "public"."ProjectAuthor"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_ProjectAuthor_updated_at" ON "public"."ProjectAuthor"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
