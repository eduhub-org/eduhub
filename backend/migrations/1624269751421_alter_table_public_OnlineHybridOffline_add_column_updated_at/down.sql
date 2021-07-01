DROP TRIGGER IF EXISTS "set_public_OnlineHybridOffline_updated_at" ON "public"."OnlineHybridOffline";
ALTER TABLE "public"."OnlineHybridOffline" DROP COLUMN "updated_at";
