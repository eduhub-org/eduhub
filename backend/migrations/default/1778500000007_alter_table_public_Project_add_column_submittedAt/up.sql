ALTER TABLE "public"."Project"
ADD COLUMN IF NOT EXISTS "submittedAt" timestamptz;

COMMENT ON COLUMN "public"."Project"."submittedAt" IS
'Timestamp at which the project most recently transitioned to SUBMITTED. Cleared when a reviewer sends the project back to ONGOING so the student-side "sent back for revisions" banner remains accurate.';
