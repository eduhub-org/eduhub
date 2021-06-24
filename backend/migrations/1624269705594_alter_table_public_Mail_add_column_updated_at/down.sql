DROP TRIGGER IF EXISTS "set_public_Mail_updated_at" ON "public"."Mail";
ALTER TABLE "public"."Mail" DROP COLUMN "updated_at";
