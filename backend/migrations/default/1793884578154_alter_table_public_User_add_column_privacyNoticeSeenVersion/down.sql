DELETE FROM "public"."MailTemplate" WHERE "type" = 'PRIVACY_POLICY_UPDATED';
DELETE FROM "public"."MailTemplateType" WHERE "value" = 'PRIVACY_POLICY_UPDATED';
ALTER TABLE "public"."User" DROP COLUMN IF EXISTS "privacyNoticeSeenVersion";
