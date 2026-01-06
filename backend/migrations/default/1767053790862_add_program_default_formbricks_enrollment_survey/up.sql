-- Add default Formbricks enrollment survey URL to Program table
ALTER TABLE "public"."Program" 
ADD COLUMN "defaultFormbricksEnrollmentSurveyUrl" TEXT NULL;

COMMENT ON COLUMN "public"."Program"."defaultFormbricksEnrollmentSurveyUrl" IS 'Default Formbricks survey URL for course enrollments/applications. Courses can override this with their own formbricksEnrollmentSurveyUrl.';

