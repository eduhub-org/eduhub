DROP TRIGGER IF EXISTS "set_public_MotivationGrade_updated_at" ON "public"."MotivationGrade";
ALTER TABLE "public"."MotivationGrade" DROP COLUMN "updated_at";
