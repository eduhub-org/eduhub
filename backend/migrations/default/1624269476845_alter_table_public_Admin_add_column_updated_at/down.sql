DROP TRIGGER IF EXISTS "set_public_Admin_updated_at" ON "public"."Admin";
ALTER TABLE "public"."Admin" DROP COLUMN "updated_at";
