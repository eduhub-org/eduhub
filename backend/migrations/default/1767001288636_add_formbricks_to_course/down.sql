-- Remove Formbricks enrollment survey configuration from Course table
ALTER TABLE "public"."Course" 
DROP COLUMN IF EXISTS "formbricksEnrollmentSurveyUrl";

