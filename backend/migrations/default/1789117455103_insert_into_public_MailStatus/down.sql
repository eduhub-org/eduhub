-- Only removes the lookup rows. MailLog.status has no foreign key to this table,
-- so rows already carrying these values keep them -- which is what we want: a
-- rollback of the lookup table must not rewrite delivery history.
DELETE FROM "public"."MailStatus" WHERE "value" = 'READY_TO_SEND';
DELETE FROM "public"."MailStatus" WHERE "value" = 'DELIVERED';
DELETE FROM "public"."MailStatus" WHERE "value" = 'BOUNCED';
DELETE FROM "public"."MailStatus" WHERE "value" = 'COMPLAINED';
