-- Remove paid email templates
DELETE FROM "public"."MailTemplate" WHERE "type" IN ('REGISTRATION_CONFIRMED_PAID', 'APPLICATION_RECEIVED_PAID');

-- Remove template types from enum (optional - may be referenced elsewhere)
DELETE FROM "public"."MailTemplateType" WHERE "value" IN ('REGISTRATION_CONFIRMED_PAID', 'APPLICATION_RECEIVED_PAID');
