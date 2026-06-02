DROP TRIGGER IF EXISTS "set_program_default_attendance_certificate_template_trg"
  ON "public"."Program";

DROP FUNCTION IF EXISTS "public"."set_program_default_attendance_certificate_template"();

ALTER TABLE "public"."AppSettings"
  DROP CONSTRAINT IF EXISTS "AppSettings_defaultAttendanceCertificateTemplateId_fkey";

ALTER TABLE "public"."AppSettings"
  DROP COLUMN IF EXISTS "defaultAttendanceCertificateTemplateId";
