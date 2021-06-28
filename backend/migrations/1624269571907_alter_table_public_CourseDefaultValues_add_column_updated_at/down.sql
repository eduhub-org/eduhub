DROP TRIGGER IF EXISTS "set_public_CourseDefaultValues_updated_at" ON "public"."CourseDefaultValues";
ALTER TABLE "public"."CourseDefaultValues" DROP COLUMN "updated_at";
