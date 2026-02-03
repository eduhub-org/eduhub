-- Remove paid email templates (only global templates, not course-specific ones)
DELETE FROM "public"."MailTemplate" 
WHERE "type" IN ('REGISTRATION_CONFIRMED_PAID', 'APPLICATION_RECEIVED_PAID') 
AND "courseId" IS NULL;

-- Remove template types from enum only if no templates reference them
DELETE FROM "public"."MailTemplateType" 
WHERE "value" = 'REGISTRATION_CONFIRMED_PAID' 
AND NOT EXISTS (
  SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'REGISTRATION_CONFIRMED_PAID'
);

DELETE FROM "public"."MailTemplateType" 
WHERE "value" = 'APPLICATION_RECEIVED_PAID' 
AND NOT EXISTS (
  SELECT 1 FROM "public"."MailTemplate" WHERE "type" = 'APPLICATION_RECEIVED_PAID'
);
