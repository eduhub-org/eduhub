DROP TRIGGER IF EXISTS "set_public_Session_updated_at" ON "public"."Session";
ALTER TABLE "public"."Session" DROP COLUMN "updated_at";
