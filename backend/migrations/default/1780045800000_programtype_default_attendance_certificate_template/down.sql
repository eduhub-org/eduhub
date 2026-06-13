-- Restore the AppSettings-level global default.
ALTER TABLE "public"."AppSettings"
  ADD COLUMN IF NOT EXISTS "defaultAttendanceCertificateTemplateId" integer;
ALTER TABLE "public"."AppSettings"
  DROP CONSTRAINT IF EXISTS "AppSettings_defaultAttendanceCertificateTemplateId_fkey";
ALTER TABLE "public"."AppSettings"
  ADD CONSTRAINT "AppSettings_defaultAttendanceCertificateTemplateId_fkey"
  FOREIGN KEY ("defaultAttendanceCertificateTemplateId")
  REFERENCES "public"."CertificateTemplate"("id")
  ON UPDATE RESTRICT ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION "public"."set_program_default_attendance_certificate_template"()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."attendanceCertificateTemplateId" IS NULL THEN
    SELECT "defaultAttendanceCertificateTemplateId"
      INTO NEW."attendanceCertificateTemplateId"
      FROM "public"."AppSettings"
     ORDER BY "appName"
     LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "set_program_default_attendance_certificate_template_trg"
  ON "public"."Program";
CREATE TRIGGER "set_program_default_attendance_certificate_template_trg"
  BEFORE INSERT ON "public"."Program"
  FOR EACH ROW EXECUTE FUNCTION "public"."set_program_default_attendance_certificate_template"();

ALTER TABLE "public"."ProgramType"
  DROP CONSTRAINT IF EXISTS "ProgramType_defaultAttendanceCertificateTemplateId_fkey";
ALTER TABLE "public"."ProgramType"
  DROP COLUMN IF EXISTS "defaultAttendanceCertificateTemplateId";
