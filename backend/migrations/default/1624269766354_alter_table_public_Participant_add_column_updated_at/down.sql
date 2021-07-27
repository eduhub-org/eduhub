DROP TRIGGER IF EXISTS "set_public_Participant_updated_at" ON "public"."Participant";
ALTER TABLE "public"."Participant" DROP COLUMN "updated_at";
