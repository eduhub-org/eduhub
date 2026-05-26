CREATE TABLE "public"."ProjectDocumentationTemplate" (
  "id" serial NOT NULL,
  "title" text NOT NULL,
  "url" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("title")
);
COMMENT ON TABLE "public"."ProjectDocumentationTemplate" IS E'Reusable documentation template (PDF or similar) referenced by Project.documentationTemplateId. Parallel to AchievementDocumentationTemplate, which is kept untouched until Step 2.';

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
CREATE TRIGGER "set_public_ProjectDocumentationTemplate_updated_at"
BEFORE UPDATE ON "public"."ProjectDocumentationTemplate"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_ProjectDocumentationTemplate_updated_at" ON "public"."ProjectDocumentationTemplate"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
