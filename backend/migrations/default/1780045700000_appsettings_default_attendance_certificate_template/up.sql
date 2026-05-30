-- App-level default attendance-certificate template, automatically applied to
-- every newly inserted Program that does not specify its own template.
--
-- The trigger reads a single AppSettings row deterministically (ORDER BY appName
-- LIMIT 1) so that in the single-row production setup the default is unambiguous
-- and in multi-row test setups we still pick the same row every time.

ALTER TABLE "public"."AppSettings"
  ADD COLUMN IF NOT EXISTS "defaultAttendanceCertificateTemplateId" integer;

ALTER TABLE "public"."AppSettings"
  DROP CONSTRAINT IF EXISTS "AppSettings_defaultAttendanceCertificateTemplateId_fkey";
ALTER TABLE "public"."AppSettings"
  ADD CONSTRAINT "AppSettings_defaultAttendanceCertificateTemplateId_fkey"
  FOREIGN KEY ("defaultAttendanceCertificateTemplateId")
  REFERENCES "public"."CertificateTemplate"("id")
  ON UPDATE RESTRICT ON DELETE SET NULL;

COMMENT ON COLUMN "public"."AppSettings"."defaultAttendanceCertificateTemplateId"
  IS E'App-level default for Program.attendanceCertificateTemplateId. Copied into every newly inserted Program by the set_program_default_attendance_certificate_template_trg trigger when the program''s own attendanceCertificateTemplateId is NULL.';

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
