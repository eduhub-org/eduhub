-- Degree completion thresholds as data instead of constants hard-coded in the
-- certificate cloud function and in each degree's Jinja template.
--
-- A "degree" is a Course inside a Program with type = 'DEGREES'; its member
-- courses are linked through CourseDegree.degreeCourseId. These two columns are
-- only meaningful for such a course. NULL means the requirement is not checked.
ALTER TABLE "public"."Course"
  ADD COLUMN "requiredEcts"       numeric NULL,
  ADD COLUMN "requiredEventCount" integer NULL;

-- NOT VALID keeps the ACCESS EXCLUSIVE lock off a full table scan; the columns are
-- NULL for every existing row anyway. Validated below, after the backfill, which
-- only needs SHARE UPDATE EXCLUSIVE.
ALTER TABLE "public"."Course"
  ADD CONSTRAINT "Course_requiredEcts_check"
    CHECK ("requiredEcts" IS NULL OR "requiredEcts" >= 0) NOT VALID,
  ADD CONSTRAINT "Course_requiredEventCount_check"
    CHECK ("requiredEventCount" IS NULL OR "requiredEventCount" >= 0) NOT VALID;

COMMENT ON COLUMN "public"."Course"."requiredEcts"
  IS E'Minimum number of ECTS a participant must have collected from this degree''s member courses (CourseDegree.degreeCourseId = this course) before a degree certificate can be generated. Only member enrollments carrying an achievementCertificateURL count, matching the DegreeParticipationStats view. Only meaningful for a course whose Program.type = ''DEGREES''. NULL = requirement not checked.';
COMMENT ON COLUMN "public"."Course"."requiredEventCount"
  IS E'Minimum number of this degree''s member courses in an EVENTS program the participant must be enrolled in before a degree certificate can be generated. Enrollment alone counts, no certificate required, matching the DegreeParticipationStats view. Only meaningful for a course whose Program.type = ''DEGREES''. NULL = requirement not checked.';

-- Preserve the previously hard-coded rule ("12.5 ECTS and at least one
-- hackathon") for every degree that exists today, so no degree changes
-- behaviour when the gate starts being enforced.
UPDATE "public"."Course" c
   SET "requiredEcts"       = 12.5,
       "requiredEventCount" = 1
  FROM "public"."Program" p
 WHERE p."id" = c."programId"
   AND p."type" = 'DEGREES';

ALTER TABLE "public"."Course" VALIDATE CONSTRAINT "Course_requiredEcts_check";
ALTER TABLE "public"."Course" VALIDATE CONSTRAINT "Course_requiredEventCount_check";

-- Extend the documented Jinja variable contract (originally written by
-- 1780045613786_migrate_achievements_to_projects) with the degree variables the
-- certificate generator now provides.
COMMENT ON COLUMN "public"."CertificateTemplate"."html"
  IS E'Jinja2 HTML body. Rendering variables depend on the certificate variant: full_name, semester, course_name, ECTS, learningGoalsList, praxisprojekt, online_courses (project-based achievement), successful_participations / passed_participations / event_participations / required_ects / required_ects_display / required_event_count / achieved_ects / achieved_ects_display / attended_event_count (degree), event_entries (attendance), template (background image).';
