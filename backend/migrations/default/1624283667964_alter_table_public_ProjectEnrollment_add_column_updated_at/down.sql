DROP TRIGGER IF EXISTS "set_public_ProjectEnrollment_updated_at" ON "public"."ProjectEnrollment";
ALTER TABLE "public"."ProjectEnrollment" DROP COLUMN "updated_at";
