DELETE FROM "public"."MailTemplate" WHERE "type" = 'ORGANIZER_ADDED' AND "courseId" IS NULL;
DELETE FROM "public"."MailTemplateType" WHERE "value" = 'ORGANIZER_ADDED';
