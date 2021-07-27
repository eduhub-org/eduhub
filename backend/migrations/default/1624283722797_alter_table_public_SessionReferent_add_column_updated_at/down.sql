DROP TRIGGER IF EXISTS "set_public_SessionReferent_updated_at" ON "public"."SessionReferent";
ALTER TABLE "public"."SessionReferent" DROP COLUMN "updated_at";
