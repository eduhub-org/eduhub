-- Source-group selection for a project slider (a CourseGroupOption row with
-- contentType = 'PROJECT'). A project slider can pull projects from selected
-- course groups and/or selected project groups; the union of both is its
-- membership. If no rows exist for a given project slider, it shows all
-- home-eligible projects.

CREATE TABLE "public"."ProjectSliderCourseGroup" (
  "id" serial NOT NULL,
  "projectSliderOptionId" integer NOT NULL,
  "courseGroupOptionId" integer NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("id"),
  UNIQUE ("projectSliderOptionId", "courseGroupOptionId"),
  CONSTRAINT "ProjectSliderCourseGroup_projectSliderOptionId_fkey"
    FOREIGN KEY ("projectSliderOptionId") REFERENCES "public"."CourseGroupOption"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "ProjectSliderCourseGroup_courseGroupOptionId_fkey"
    FOREIGN KEY ("courseGroupOptionId") REFERENCES "public"."CourseGroupOption"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
COMMENT ON TABLE "public"."ProjectSliderCourseGroup" IS E'Selects a course group as a source for a project slider (CourseGroupOption with contentType = PROJECT). Projects linked to courses in that course group are included.';

CREATE INDEX "ProjectSliderCourseGroup_projectSliderOptionId_idx" ON "public"."ProjectSliderCourseGroup" ("projectSliderOptionId");
CREATE INDEX "ProjectSliderCourseGroup_courseGroupOptionId_idx" ON "public"."ProjectSliderCourseGroup" ("courseGroupOptionId");

CREATE TABLE "public"."ProjectSliderProjectGroup" (
  "id" serial NOT NULL,
  "projectSliderOptionId" integer NOT NULL,
  "projectGroupOptionId" integer NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("id"),
  UNIQUE ("projectSliderOptionId", "projectGroupOptionId"),
  CONSTRAINT "ProjectSliderProjectGroup_projectSliderOptionId_fkey"
    FOREIGN KEY ("projectSliderOptionId") REFERENCES "public"."CourseGroupOption"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "ProjectSliderProjectGroup_projectGroupOptionId_fkey"
    FOREIGN KEY ("projectGroupOptionId") REFERENCES "public"."ProjectGroupOption"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
COMMENT ON TABLE "public"."ProjectSliderProjectGroup" IS E'Selects a project group as a source for a project slider (CourseGroupOption with contentType = PROJECT).';

CREATE INDEX "ProjectSliderProjectGroup_projectSliderOptionId_idx" ON "public"."ProjectSliderProjectGroup" ("projectSliderOptionId");
CREATE INDEX "ProjectSliderProjectGroup_projectGroupOptionId_idx" ON "public"."ProjectSliderProjectGroup" ("projectGroupOptionId");

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
CREATE TRIGGER "set_public_ProjectSliderCourseGroup_updated_at"
BEFORE UPDATE ON "public"."ProjectSliderCourseGroup"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
CREATE TRIGGER "set_public_ProjectSliderProjectGroup_updated_at"
BEFORE UPDATE ON "public"."ProjectSliderProjectGroup"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();

-- Enforce the content-type invariant at the schema level: a project slider's
-- projectSliderOptionId must reference a CourseGroupOption with contentType =
-- 'PROJECT', and a course-group source must reference one with 'COURSE'. This
-- guards against bad writes from the admin mutations persisting unusable config.
CREATE OR REPLACE FUNCTION "public"."check_project_slider_selection_types"()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT "contentType" FROM "public"."CourseGroupOption" WHERE "id" = NEW."projectSliderOptionId") <> 'PROJECT' THEN
    RAISE EXCEPTION 'projectSliderOptionId % must reference a CourseGroupOption with contentType = PROJECT', NEW."projectSliderOptionId";
  END IF;
  -- Nested (not AND-combined) so NEW."courseGroupOptionId" is only referenced for
  -- ProjectSliderCourseGroup; the ProjectSliderProjectGroup NEW record has no such
  -- field and a single AND expression is not guaranteed to short-circuit.
  IF TG_TABLE_NAME = 'ProjectSliderCourseGroup' THEN
    IF (SELECT "contentType" FROM "public"."CourseGroupOption" WHERE "id" = NEW."courseGroupOptionId") <> 'COURSE' THEN
      RAISE EXCEPTION 'courseGroupOptionId % must reference a CourseGroupOption with contentType = COURSE', NEW."courseGroupOptionId";
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "check_ProjectSliderCourseGroup_types"
BEFORE INSERT OR UPDATE ON "public"."ProjectSliderCourseGroup"
FOR EACH ROW
EXECUTE PROCEDURE "public"."check_project_slider_selection_types"();
CREATE TRIGGER "check_ProjectSliderProjectGroup_types"
BEFORE INSERT OR UPDATE ON "public"."ProjectSliderProjectGroup"
FOR EACH ROW
EXECUTE PROCEDURE "public"."check_project_slider_selection_types"();
