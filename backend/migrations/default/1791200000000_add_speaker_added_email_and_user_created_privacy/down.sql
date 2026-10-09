DROP INDEX IF EXISTS "public"."MailLog_session_speaker_mail_unique";

-- Course-specific copies are admin content, so only the seeded default goes,
-- and the type stays while any of those copies still references it.
DELETE FROM "public"."MailTemplate"
  WHERE "type" = 'SESSION_SPEAKER_ADDED' AND "courseId" IS NULL;

DELETE FROM "public"."MailTemplateType"
  WHERE "value" = 'SESSION_SPEAKER_ADDED'
    AND NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'SESSION_SPEAKER_ADDED');

-- USER_CREATED is not reverted: the old seed showed [User:Firstname] literally
-- and lacked the privacy notice, so there is nothing worth restoring.
