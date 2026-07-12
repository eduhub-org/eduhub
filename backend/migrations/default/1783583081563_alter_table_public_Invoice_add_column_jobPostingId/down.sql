DROP INDEX IF EXISTS "public"."Invoice_jobPostingId_idx";

ALTER TABLE "public"."Invoice"
  DROP CONSTRAINT IF EXISTS "Invoice_jobPostingId_fkey",
  DROP COLUMN IF EXISTS "jobPostingId";
