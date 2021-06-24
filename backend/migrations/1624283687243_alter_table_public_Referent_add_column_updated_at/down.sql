DROP TRIGGER IF EXISTS "set_public_Referent_updated_at" ON "public"."Referent";
ALTER TABLE "public"."Referent" DROP COLUMN "updated_at";
