-- Restore formbricksSurveyId column (for rollback purposes)
-- Note: This will restore the column but not populate it with data
ALTER TABLE "public"."Course" 
ADD COLUMN "formbricksSurveyId" TEXT NULL;

COMMENT ON COLUMN "public"."Course"."formbricksSurveyId" IS 'Optional Formbricks survey ID for custom application questionnaire';

