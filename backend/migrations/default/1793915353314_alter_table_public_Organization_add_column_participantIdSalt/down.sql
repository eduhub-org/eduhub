-- Deliberately keeps "participantIdSalt": once funders have received salted
-- participant ids, dropping the salts would give them new ids on a re-run of
-- up.sql. Drop the column by hand only if no salted report was ever issued:
--   ALTER TABLE "public"."Organization" DROP COLUMN "participantIdSalt";
DROP TRIGGER IF EXISTS "organization_keep_participant_id_salt" ON "public"."Organization";
DROP FUNCTION IF EXISTS "public"."organization_keep_participant_id_salt"();
