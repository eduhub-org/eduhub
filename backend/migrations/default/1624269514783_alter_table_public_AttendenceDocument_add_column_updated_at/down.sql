DROP TRIGGER IF EXISTS "set_public_AttendenceDocument_updated_at" ON "public"."AttendenceDocument";
ALTER TABLE "public"."AttendenceDocument" DROP COLUMN "updated_at";
