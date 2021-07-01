DROP TRIGGER IF EXISTS "set_public_CourseButtons_updated_at" ON "public"."CourseButtons";
ALTER TABLE "public"."CourseButtons" DROP COLUMN "updated_at";
