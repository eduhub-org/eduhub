DELETE FROM "public"."MailTemplate"
WHERE "type" = 'WAITLIST_NOTICE';

DELETE FROM "public"."MailTemplateType"
WHERE "value" = 'WAITLIST_NOTICE';
