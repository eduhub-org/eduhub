-- Remove the unique constraint
ALTER TABLE "public"."CourseAddonMapping" 
DROP CONSTRAINT IF EXISTS "CourseAddonMapping_courseId_questionId_choiceId_key";

-- Restore the old unique constraint
ALTER TABLE "public"."CourseAddonMapping" 
ADD CONSTRAINT "CourseAddonMapping_courseId_questionId_key" 
UNIQUE ("courseId", "questionId");

-- Remove choiceId column
ALTER TABLE "public"."CourseAddonMapping" 
DROP COLUMN IF EXISTS "choiceId";
