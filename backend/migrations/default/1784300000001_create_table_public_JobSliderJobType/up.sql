-- Source-type selection for a job slider (a CourseGroupOption row with
-- contentType = 'JOB'). A job slider pulls published job postings from the
-- selected job posting types; the union of the selected types is its
-- membership. If no rows exist for a given job slider, it shows all published
-- postings.

CREATE TABLE "public"."JobSliderJobType" (
  "id" serial NOT NULL,
  "jobSliderOptionId" integer NOT NULL,
  "jobType" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("id"),
  UNIQUE ("jobSliderOptionId", "jobType"),
  CONSTRAINT "JobSliderJobType_jobSliderOptionId_fkey"
    FOREIGN KEY ("jobSliderOptionId") REFERENCES "public"."CourseGroupOption"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  -- No ON DELETE CASCADE here (unlike the slider-option FK above): jobType
  -- references the JobPostingType enum table, and cascade-deleting the last
  -- selected type would silently widen the slider to "all published postings".
  -- Restrict instead, matching every other enum-value FK in the schema, so
  -- removing an enum value is an explicit, loud operation.
  CONSTRAINT "JobSliderJobType_jobType_fkey"
    FOREIGN KEY ("jobType") REFERENCES "public"."JobPostingType"("value") ON UPDATE CASCADE ON DELETE RESTRICT
);
COMMENT ON TABLE "public"."JobSliderJobType" IS E'Selects a job posting type as a source for a job slider (CourseGroupOption with contentType = JOB). No rows for a slider means all published postings.';
COMMENT ON COLUMN "public"."JobSliderJobType"."jobSliderOptionId" IS E'The CourseGroupOption (contentType = JOB) this selection belongs to.';
COMMENT ON COLUMN "public"."JobSliderJobType"."jobType" IS E'The JobPostingType value this job slider pulls postings from.';

CREATE INDEX "JobSliderJobType_jobSliderOptionId_idx" ON "public"."JobSliderJobType" ("jobSliderOptionId");
CREATE INDEX "JobSliderJobType_jobType_idx" ON "public"."JobSliderJobType" ("jobType");

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
CREATE TRIGGER "set_public_JobSliderJobType_updated_at"
BEFORE UPDATE ON "public"."JobSliderJobType"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();

-- Enforce the content-type invariant at the schema level: a job slider's
-- jobSliderOptionId must reference a CourseGroupOption with contentType = 'JOB'.
-- This guards against bad writes from the admin mutations persisting unusable
-- config.
CREATE OR REPLACE FUNCTION "public"."check_job_slider_selection_types"()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT "contentType" FROM "public"."CourseGroupOption" WHERE "id" = NEW."jobSliderOptionId") <> 'JOB' THEN
    RAISE EXCEPTION 'jobSliderOptionId % must reference a CourseGroupOption with contentType = JOB', NEW."jobSliderOptionId";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "check_JobSliderJobType_types"
BEFORE INSERT OR UPDATE ON "public"."JobSliderJobType"
FOR EACH ROW
EXECUTE PROCEDURE "public"."check_job_slider_selection_types"();
