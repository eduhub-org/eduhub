DELETE FROM "public"."MailTemplate" WHERE "type" = 'INSTRUCTOR_CERTIFICATE_READY' AND "courseId" IS NULL;
DELETE FROM "public"."MailTemplateType"
WHERE "value" = 'INSTRUCTOR_CERTIFICATE_READY'
AND NOT EXISTS (SELECT 1 FROM "public"."MailTemplate" mt WHERE mt."type" = 'INSTRUCTOR_CERTIFICATE_READY');
DROP INDEX IF EXISTS "public"."MailLog_instructor_certificate_mail_unique";
ALTER TABLE "public"."CourseInstructor" DROP COLUMN IF EXISTS "certificateURL";
ALTER TABLE "public"."Program" DROP CONSTRAINT IF EXISTS "Program_instructorCertificateTemplateId_fkey";
ALTER TABLE "public"."Program" DROP COLUMN IF EXISTS "instructorCertificateTemplateId";
