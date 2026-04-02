DELETE FROM "public"."MailTemplate"
WHERE "type" = 'WAITLIST_NOTICE' AND "courseId" IS NULL;

DELETE FROM "public"."MailTemplateType"
WHERE "value" = 'WAITLIST_NOTICE';
