DROP TRIGGER IF EXISTS "set_public_CourseStatus_updated_at" ON "public"."CourseStatus";
ALTER TABLE "public"."CourseStatus" DROP COLUMN "updated_at";
