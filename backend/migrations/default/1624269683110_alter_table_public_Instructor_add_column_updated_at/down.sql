DROP TRIGGER IF EXISTS "set_public_Instructor_updated_at" ON "public"."Instructor";
ALTER TABLE "public"."Instructor" DROP COLUMN "updated_at";
