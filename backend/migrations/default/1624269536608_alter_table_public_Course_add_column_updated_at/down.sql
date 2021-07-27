DROP TRIGGER IF EXISTS "set_public_Course_updated_at" ON "public"."Course";
ALTER TABLE "public"."Course" DROP COLUMN "updated_at";
