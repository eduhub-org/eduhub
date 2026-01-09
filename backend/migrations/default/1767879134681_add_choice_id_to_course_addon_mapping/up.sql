-- Add choiceId column to CourseAddonMapping table
ALTER TABLE "public"."CourseAddonMapping" 
ADD COLUMN "choiceId" text;

-- Drop the old unique constraint
ALTER TABLE "public"."CourseAddonMapping" 
DROP CONSTRAINT IF EXISTS "CourseAddonMapping_courseId_questionId_key";

-- Add new unique constraint including choiceId
ALTER TABLE "public"."CourseAddonMapping" 
ADD CONSTRAINT "CourseAddonMapping_courseId_questionId_choiceId_key" 
UNIQUE ("courseId", "questionId", "choiceId");

COMMENT ON COLUMN "public"."CourseAddonMapping"."choiceId" IS 'Formbricks choice ID for multiple choice questions (null for non-choice questions)';
