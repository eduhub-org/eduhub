COMMENT ON COLUMN "public"."CertificateTemplate"."html"
  IS E'Jinja2 HTML body. Rendering variables depend on the certificate variant: full_name, semester, course_name, ECTS, learningGoalsList, praxisprojekt, online_courses (project-based achievement), successful_participations (degree), event_entries (attendance), template (background image).';

ALTER TABLE "public"."Course" DROP CONSTRAINT IF EXISTS "Course_requiredEventCount_check";
ALTER TABLE "public"."Course" DROP CONSTRAINT IF EXISTS "Course_requiredEcts_check";

ALTER TABLE "public"."Course" DROP COLUMN IF EXISTS "requiredEventCount";
ALTER TABLE "public"."Course" DROP COLUMN IF EXISTS "requiredEcts";
