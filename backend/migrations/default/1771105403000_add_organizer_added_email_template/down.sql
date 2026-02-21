DELETE FROM "public"."MailTemplate" WHERE "type" = 'ORGANIZER_ADDED' AND "courseId" IS NULL;
DELETE FROM "public"."MailTemplateType"
WHERE "value" = 'ORGANIZER_ADDED'
AND NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" mt WHERE mt."type" = 'ORGANIZER_ADDED');
