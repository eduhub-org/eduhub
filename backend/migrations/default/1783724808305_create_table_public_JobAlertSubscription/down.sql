DELETE FROM "public"."MailTemplate" WHERE "type" = 'JOB_ALERT';
DELETE FROM "public"."MailTemplateType" WHERE "value" = 'JOB_ALERT';
DROP TABLE IF EXISTS "public"."JobAlertSubscription";
