CREATE TABLE "public"."ProjectMentor" (
  "id" serial NOT NULL,
  "projectId" integer NOT NULL,
  "userId" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
COMMENT ON TABLE "public"."ProjectMentor" IS E'Mentor assigned to a project. Mirrors AchievementOptionMentor; mentors are independent of the implementing-author lifecycle and survive copies from a template to a claimed project.';

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
CREATE TRIGGER "set_public_ProjectMentor_updated_at"
BEFORE UPDATE ON "public"."ProjectMentor"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_ProjectMentor_updated_at" ON "public"."ProjectMentor"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
