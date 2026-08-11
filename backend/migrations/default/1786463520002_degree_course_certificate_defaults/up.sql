-- A degree never awards an attendance certificate: its point is the degree
-- certificate, which is an achievement certificate. The two "possible certificates"
-- toggles are therefore hidden in the admin UI for a course inside a DEGREES
-- program - so the values have to be correct without anyone setting them.
--
-- They are not cosmetic:
--   * the student-facing degree page renders the completed-components list and the
--     certificate download only when at least one of the two flags is true, and
--   * the public info panel shows a course's ECTS only when
--     achievementCertificatePossible is true.

-- 1. Fix every degree that exists today.
UPDATE "public"."Course" c
   SET "achievementCertificatePossible" = true,
       "attendanceCertificatePossible"  = false
  FROM "public"."Program" p
 WHERE p.id = c."programId"
   AND p."type" = 'DEGREES'
   AND (c."achievementCertificatePossible" IS DISTINCT FROM true
     OR c."attendanceCertificatePossible"  IS DISTINCT FROM false);

-- 2. And every degree created from now on, regardless of the client: the column
--    defaults are both false, and Course.programId is not editable, so deciding
--    this once at insert time is enough.
CREATE OR REPLACE FUNCTION "public"."set_degree_course_certificate_defaults"()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM "public"."Program" p
     WHERE p.id = NEW."programId"
       AND p."type" = 'DEGREES'
  ) THEN
    NEW."achievementCertificatePossible" := true;
    NEW."attendanceCertificatePossible"  := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION "public"."set_degree_course_certificate_defaults" IS
  'Forces the certificate flags of a course in a DEGREES program (achievement possible, attendance not), because the admin UI hides those toggles for degrees.';

DROP TRIGGER IF EXISTS "set_degree_course_certificate_defaults_trg" ON "public"."Course";

CREATE TRIGGER "set_degree_course_certificate_defaults_trg"
  BEFORE INSERT ON "public"."Course"
  FOR EACH ROW EXECUTE FUNCTION "public"."set_degree_course_certificate_defaults"();
