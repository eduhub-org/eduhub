ALTER TABLE "public"."Project"
  ADD COLUMN "suggestedForPublication" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "public"."Project"."suggestedForPublication" IS
  'Course staff flag: a completed project is suggested for showcase publication. Toggling this does not publish the project (status PUBLISHED is set separately).';
