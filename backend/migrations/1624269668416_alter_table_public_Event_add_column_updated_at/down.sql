DROP TRIGGER IF EXISTS "set_public_Event_updated_at" ON "public"."Event";
ALTER TABLE "public"."Event" DROP COLUMN "updated_at";
