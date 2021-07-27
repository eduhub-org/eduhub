DROP TRIGGER IF EXISTS "set_public_MailLog_updated_at" ON "public"."MailLog";
ALTER TABLE "public"."MailLog" DROP COLUMN "updated_at";
