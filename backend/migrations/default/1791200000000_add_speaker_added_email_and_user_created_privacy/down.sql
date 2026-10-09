DROP INDEX IF EXISTS "public"."MailLog_session_speaker_mail_unique";

DELETE FROM "public"."MailTemplate"
  WHERE "type" = 'SESSION_SPEAKER_ADDED';

DELETE FROM "public"."MailTemplateType"
  WHERE "value" = 'SESSION_SPEAKER_ADDED';

-- USER_CREATED is not reverted: the old seed showed [User:Firstname] literally
-- and lacked the privacy notice, so there is nothing worth restoring.
