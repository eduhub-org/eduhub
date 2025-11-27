DELETE FROM "public"."MailTemplate" WHERE "type" = 'USER_CREATED' AND "courseId" IS NULL;
DELETE FROM "public"."MailTemplateType" WHERE "value" = 'USER_CREATED';

