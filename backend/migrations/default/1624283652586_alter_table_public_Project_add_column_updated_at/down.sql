DROP TRIGGER IF EXISTS "set_public_Project_updated_at" ON "public"."Project";
ALTER TABLE "public"."Project" DROP COLUMN "updated_at";
