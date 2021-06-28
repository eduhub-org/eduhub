DROP TRIGGER IF EXISTS "set_public_Enrollment_updated_at" ON "public"."Enrollment";
ALTER TABLE "public"."Enrollment" DROP COLUMN "updated_at";
