-- Replace the single AppSettings-level default attendance-certificate template
-- with one default per ProgramType (COURSES, EVENTS, DEGREES, ...).
--
-- Rationale: a single global default is too coarse — a course attendance proof
-- looks different from an event attendance proof. Keeping the default on the
-- ProgramType enum row lets each program type pick its own HTML.
--
-- The BEFORE INSERT ON Program trigger is rebuilt to look up the new program's
-- ProgramType default and copy it into Program.attendanceCertificateTemplateId
-- when the program's own value is NULL.

ALTER TABLE "public"."ProgramType"
  ADD COLUMN IF NOT EXISTS "defaultAttendanceCertificateTemplateId" integer;

ALTER TABLE "public"."ProgramType"
  DROP CONSTRAINT IF EXISTS "ProgramType_defaultAttendanceCertificateTemplateId_fkey";
ALTER TABLE "public"."ProgramType"
  ADD CONSTRAINT "ProgramType_defaultAttendanceCertificateTemplateId_fkey"
  FOREIGN KEY ("defaultAttendanceCertificateTemplateId")
  REFERENCES "public"."CertificateTemplate"("id")
  ON UPDATE RESTRICT ON DELETE SET NULL;

COMMENT ON COLUMN "public"."ProgramType"."defaultAttendanceCertificateTemplateId"
  IS E'App-level default attendance-certificate template for programs of this type. Copied into every newly inserted Program by the set_program_default_attendance_certificate_template_trg trigger when the program''s own attendanceCertificateTemplateId is NULL.';

CREATE OR REPLACE FUNCTION "public"."set_program_default_attendance_certificate_template"()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."attendanceCertificateTemplateId" IS NULL THEN
    SELECT "defaultAttendanceCertificateTemplateId"
      INTO NEW."attendanceCertificateTemplateId"
      FROM "public"."ProgramType"
     WHERE "value" = NEW."type";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- The trigger definition itself is unchanged; only the function body above
-- changed. Drop and recreate to be explicit and idempotent.
DROP TRIGGER IF EXISTS "set_program_default_attendance_certificate_template_trg"
  ON "public"."Program";

CREATE TRIGGER "set_program_default_attendance_certificate_template_trg"
  BEFORE INSERT ON "public"."Program"
  FOR EACH ROW EXECUTE FUNCTION "public"."set_program_default_attendance_certificate_template"();

-- Retire the global AppSettings-level default (added in migration
-- 1780045700000). The new per-ProgramType column replaces it.
ALTER TABLE "public"."AppSettings"
  DROP CONSTRAINT IF EXISTS "AppSettings_defaultAttendanceCertificateTemplateId_fkey";
ALTER TABLE "public"."AppSettings"
  DROP COLUMN IF EXISTS "defaultAttendanceCertificateTemplateId";
