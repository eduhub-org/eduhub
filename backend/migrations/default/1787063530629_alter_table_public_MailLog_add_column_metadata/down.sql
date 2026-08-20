DROP INDEX IF EXISTS "public"."MailLog_metadata_idx";

ALTER TABLE "public"."MailLog" DROP COLUMN IF EXISTS "metadata";
