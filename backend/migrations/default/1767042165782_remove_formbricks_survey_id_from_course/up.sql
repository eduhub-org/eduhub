-- Remove redundant formbricksSurveyId column from Course table
-- The survey ID can be extracted from formbricksSurveyUrl, making this field redundant
ALTER TABLE "public"."Course" 
DROP COLUMN IF EXISTS "formbricksSurveyId";

