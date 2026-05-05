CREATE TABLE "public"."Project" (
  "id" serial NOT NULL,
  "title" text NOT NULL DEFAULT 'Neues Projekt',
  "tagline" text,
  "description" text,
  "coverImageUrl" text,
  "documentationUrl" text,
  "presentationUrl" text,
  "externalUrl" text,
  "documentationTemplateId" integer,
  "evaluationScriptUrl" text,
  "csvResults" text,
  "status" text NOT NULL DEFAULT 'PROPOSED',
  "type" text,
  "achievementCertificateType" text,
  "rating" text,
  "score" numeric,
  "acceptingParticipants" boolean NOT NULL DEFAULT true,
  "organizationId" integer,
  "proposedByUserId" uuid NOT NULL,
  "parentProjectId" integer,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
COMMENT ON TABLE "public"."Project" IS E'Unified project entity that replaces AchievementOption (template) and AchievementRecord (submission). A row in PROPOSED status with no implementing authors represents an open template; copying produces a new row with parentProjectId set and the implementing author added to ProjectAuthor.';

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
