DROP TRIGGER IF EXISTS "set_public_Person_updated_at" ON "public"."Person";
ALTER TABLE "public"."Person" DROP COLUMN "updated_at";
