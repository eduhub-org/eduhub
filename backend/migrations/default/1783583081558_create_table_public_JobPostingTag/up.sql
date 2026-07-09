-- Free-form tags on job postings (StuJo tags; autocomplete source).
CREATE TABLE "public"."JobPostingTag" (
  "id"           serial      NOT NULL,
  "jobPostingId" integer     NOT NULL,
  "name"         text        NOT NULL,
  "created_at"   timestamptz NOT NULL DEFAULT now(),
  "updated_at"   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("jobPostingId", "name")
);

COMMENT ON TABLE "public"."JobPostingTag" IS E'Free-form tag on a job posting.';

ALTER TABLE "public"."JobPostingTag"
  ADD CONSTRAINT "JobPostingTag_jobPostingId_fkey"
  FOREIGN KEY ("jobPostingId") REFERENCES "public"."JobPosting"("id")
  ON UPDATE RESTRICT ON DELETE CASCADE;

CREATE INDEX "JobPostingTag_jobPostingId_idx" ON "public"."JobPostingTag" ("jobPostingId");

CREATE TRIGGER "set_public_JobPostingTag_updated_at"
BEFORE UPDATE ON "public"."JobPostingTag"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
