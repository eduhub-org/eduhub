-- Remove default templates and enum values added in up.sql
DELETE FROM "public"."MailTemplate"
WHERE "courseId" IS NULL AND "type" IN (
  'CERTIFICATE_ACHIEVEMENT_READY',
  'CERTIFICATE_ATTENDANCE_READY',
  'ENROLLMENT_CANCELLED',
  'ENROLLMENT_ABORTED',
  'WAITLIST_PROMOTED',
  'INVITATION_EXPIRING_SOON',
  'INVITATION_EXPIRED'
);

-- Only drop an enum value if no MailTemplate row still references it
DELETE FROM "public"."MailTemplateType" mtt
WHERE mtt."value" IN (
  'CERTIFICATE_ACHIEVEMENT_READY',
  'CERTIFICATE_ATTENDANCE_READY',
  'ENROLLMENT_CANCELLED',
  'ENROLLMENT_ABORTED',
  'WAITLIST_PROMOTED',
  'INVITATION_EXPIRING_SOON',
  'INVITATION_EXPIRED'
)
AND NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" mt WHERE mt."type" = mtt."value");
