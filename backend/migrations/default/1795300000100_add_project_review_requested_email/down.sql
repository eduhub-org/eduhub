DELETE FROM "public"."MailTemplate"
WHERE "courseId" IS NULL AND "type" = 'PROJECT_REVIEW_REQUESTED';

DELETE FROM "public"."MailTemplateType" mtt
WHERE mtt."value" = 'PROJECT_REVIEW_REQUESTED'
AND NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" mt WHERE mt."type" = mtt."value");
