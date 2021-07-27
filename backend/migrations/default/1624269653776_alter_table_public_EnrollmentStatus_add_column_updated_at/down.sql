DROP TRIGGER IF EXISTS "set_public_EnrollmentStatus_updated_at" ON "public"."EnrollmentStatus";
ALTER TABLE "public"."EnrollmentStatus" DROP COLUMN "updated_at";
