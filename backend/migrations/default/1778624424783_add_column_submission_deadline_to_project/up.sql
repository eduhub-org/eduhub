ALTER TABLE "public"."Project"
  ADD COLUMN IF NOT EXISTS "submissionDeadline" timestamptz;

COMMENT ON COLUMN "public"."Project"."submissionDeadline" IS
  'Optional per-project submission deadline. When null, the effective deadline is taken from the course (projectSubmissionDeadline) or program defaults.';
