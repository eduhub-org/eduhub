ALTER TABLE "public"."Project"
  ADD COLUMN IF NOT EXISTS "ratingComment" text;

COMMENT ON COLUMN "public"."Project"."ratingComment" IS E'Optional instructor comment accompanying the project rating (UNRATED/PASSED/FAILED).';
