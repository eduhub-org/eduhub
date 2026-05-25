ALTER TABLE "public"."Program"
ADD COLUMN IF NOT EXISTS "defaultProjectSubmissionDeadline" timestamptz;

UPDATE "public"."Program"
SET "defaultProjectSubmissionDeadline" = "achievementRecordUploadDeadline"
WHERE "defaultProjectSubmissionDeadline" IS NULL
  AND "achievementRecordUploadDeadline" IS NOT NULL;

COMMENT ON COLUMN "public"."Program"."defaultProjectSubmissionDeadline" IS
'Program-wide default for the project submission deadline. Used when a course does not set its own Course.projectSubmissionDeadline. Backfilled from the deprecated Program.achievementRecordUploadDeadline column, which will be dropped in Step 2.';
