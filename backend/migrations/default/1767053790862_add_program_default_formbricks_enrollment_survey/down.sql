-- Remove default Formbricks enrollment survey URL from Program table
ALTER TABLE "public"."Program" 
DROP COLUMN IF EXISTS "defaultFormbricksEnrollmentSurveyUrl";

