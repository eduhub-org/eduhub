DROP TRIGGER IF EXISTS "set_public_Attendence_updated_at" ON "public"."Attendence";
ALTER TABLE "public"."Attendence" DROP COLUMN "updated_at";
