DROP TRIGGER IF EXISTS "set_public_Employment_updated_at" ON "public"."Employment";
ALTER TABLE "public"."Employment" DROP COLUMN "updated_at";
