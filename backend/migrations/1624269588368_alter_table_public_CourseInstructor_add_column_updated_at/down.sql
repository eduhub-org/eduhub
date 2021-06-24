DROP TRIGGER IF EXISTS "set_public_CourseInstructor_updated_at" ON "public"."CourseInstructor";
ALTER TABLE "public"."CourseInstructor" DROP COLUMN "updated_at";
