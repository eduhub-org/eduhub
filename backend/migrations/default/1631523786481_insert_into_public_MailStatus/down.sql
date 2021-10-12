DELETE FROM "public"."MailStatus" WHERE "value" = 'SENDING_ERROR';
DELETE FROM "public"."MailStatus" WHERE "value" = 'UNSENT';
DELETE FROM "public"."MailStatus" WHERE "value" = 'SENT';
