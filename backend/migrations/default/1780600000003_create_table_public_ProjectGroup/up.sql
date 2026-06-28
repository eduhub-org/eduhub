-- Junction assigning projects to ProjectGroupOptions (mirrors CourseGroup).
CREATE TABLE "public"."ProjectGroup" (
  "id" serial NOT NULL,
  "projectId" integer NOT NULL,
  "groupOptionId" integer NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("id"),
  UNIQUE ("projectId", "groupOptionId"),
  FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY ("groupOptionId") REFERENCES "public"."ProjectGroupOption"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
COMMENT ON TABLE "public"."ProjectGroup" IS E'Assigns a project to a ProjectGroupOption so it can be selected into project sliders.';

CREATE INDEX "ProjectGroup_projectId_idx" ON "public"."ProjectGroup" ("projectId");
CREATE INDEX "ProjectGroup_groupOptionId_idx" ON "public"."ProjectGroup" ("groupOptionId");

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
CREATE TRIGGER "set_public_ProjectGroup_updated_at"
BEFORE UPDATE ON "public"."ProjectGroup"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_ProjectGroup_updated_at" ON "public"."ProjectGroup"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
