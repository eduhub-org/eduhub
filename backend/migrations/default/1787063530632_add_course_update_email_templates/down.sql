DELETE FROM "public"."MailTemplate"
WHERE "courseId" IS NULL AND "type" IN (
  'SESSION_RESCHEDULED',
  'PAYMENT_RECEIPT',
  'COURSE_CONTINUATION_INQUIRY'
);

DELETE FROM "public"."MailTemplateType" mtt
WHERE mtt."value" IN (
  'SESSION_RESCHEDULED',
  'PAYMENT_RECEIPT',
  'COURSE_CONTINUATION_INQUIRY'
)
AND NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" mt WHERE mt."type" = mtt."value");
