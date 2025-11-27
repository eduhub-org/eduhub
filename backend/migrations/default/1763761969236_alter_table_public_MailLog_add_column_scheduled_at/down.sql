DROP INDEX IF EXISTS "public"."MailLog_scheduledAt_idx";
ALTER TABLE "public"."MailLog" DROP COLUMN IF EXISTS "scheduledAt";

