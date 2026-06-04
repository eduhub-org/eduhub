ALTER TABLE "public"."Project"
ADD COLUMN IF NOT EXISTS "projectReviewRequestedAt" timestamptz NULL;

COMMENT ON COLUMN "public"."Project"."projectReviewRequestedAt"
IS E'Timestamp when project authors asked course staff to review the proposed project (still PROPOSED until staff confirm the team).';
