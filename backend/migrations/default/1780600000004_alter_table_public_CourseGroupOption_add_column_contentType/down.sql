ALTER TABLE "public"."CourseGroupOption" DROP CONSTRAINT IF EXISTS "CourseGroupOption_contentType_check";
ALTER TABLE "public"."CourseGroupOption" DROP COLUMN IF EXISTS "contentType";
