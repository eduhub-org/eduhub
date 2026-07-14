-- Saved (bookmarked) job postings per user (StuJo rememberedjobs).
CREATE TABLE "public"."SavedJobPosting" (
  "id"           serial      NOT NULL,
  "userId"       uuid        NOT NULL,
  "jobPostingId" integer     NOT NULL,
  "created_at"   timestamptz NOT NULL DEFAULT now(),
  "updated_at"   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("userId", "jobPostingId")
);

COMMENT ON TABLE "public"."SavedJobPosting" IS E'Job posting bookmarked by a user.';

ALTER TABLE "public"."SavedJobPosting"
  ADD CONSTRAINT "SavedJobPosting_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
  ON UPDATE RESTRICT ON DELETE CASCADE;

ALTER TABLE "public"."SavedJobPosting"
  ADD CONSTRAINT "SavedJobPosting_jobPostingId_fkey"
  FOREIGN KEY ("jobPostingId") REFERENCES "public"."JobPosting"("id")
  ON UPDATE RESTRICT ON DELETE CASCADE;

CREATE INDEX "SavedJobPosting_userId_idx" ON "public"."SavedJobPosting" ("userId");
CREATE INDEX "SavedJobPosting_jobPostingId_idx" ON "public"."SavedJobPosting" ("jobPostingId");

CREATE TRIGGER "set_public_SavedJobPosting_updated_at"
BEFORE UPDATE ON "public"."SavedJobPosting"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
