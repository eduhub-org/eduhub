ALTER TABLE "public"."Course"
ADD COLUMN IF NOT EXISTS "projectSubmissionDeadline" timestamptz;

COMMENT ON COLUMN "public"."Course"."projectSubmissionDeadline" IS
'Per-course override for the project submission deadline. When NULL, Program.defaultProjectSubmissionDeadline applies.';
