-- Add Formbricks enrollment survey configuration to Course table
ALTER TABLE "public"."Course" 
ADD COLUMN "formbricksEnrollmentSurveyUrl" TEXT NULL;

COMMENT ON COLUMN "public"."Course"."formbricksEnrollmentSurveyUrl" IS 'Full URL to the Formbricks survey for course enrollment/application (for iframe embedding). Overrides program default if set.';

