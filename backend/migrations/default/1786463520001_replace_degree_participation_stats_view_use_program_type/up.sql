-- The frontend, the admin UI and the degree certificate generator all discriminate
-- programs on Program.type, whose values are exactly COURSES / EVENTS / DEGREES.
-- This view used Program."shortTitle", an editable free-text label, so an
-- organization that renames its programs silently lost its degree statistics: no row
-- at all for a renamed DEGREES program, zero events for a renamed EVENTS program.
-- The degree certificate requirement gate is checked against the same rule these
-- numbers express, so the two must not be able to disagree.
--
-- Program.type is trustworthy here even though migration 1734993470424 introduced it
-- with DEFAULT 'COURSES' and nothing ever backfilled it from the old label: production
-- was checked for programs whose "shortTitle" claims DEGREES/EVENTS while "type"
-- disagrees, and for any degree participation number that would change as a result.
-- Both came back empty.
--
-- Column names, order and types are unchanged, so no Hasura metadata change is
-- required and dependent objects survive the replace.
CREATE OR REPLACE VIEW "public"."DegreeParticipationStats" AS
SELECT
  degree_enrollment."courseId" AS "degreeCourseId",
  degree_enrollment."userId",
  COALESCE(
    SUM(
      CASE
        WHEN related_enrollment."achievementCertificateURL" IS NOT NULL
          AND REPLACE(course_row.ects, ',', '.') ~ '^[0-9]+(\.[0-9]+)?$'
          THEN REPLACE(course_row.ects, ',', '.')::numeric
        ELSE 0
      END
    ),
    0
  ) AS "ectsTotal",
  COUNT(*) FILTER (
    WHERE program_row."type" = 'EVENTS'
  ) AS "attendedEventCount"
FROM "public"."CourseEnrollment" degree_enrollment
JOIN "public"."Course" degree_course_row
  ON degree_course_row.id = degree_enrollment."courseId"
JOIN "public"."Program" degree_program_row
  ON degree_program_row.id = degree_course_row."programId"
LEFT JOIN "public"."CourseEnrollment" related_enrollment
  ON related_enrollment."userId" = degree_enrollment."userId"
  AND EXISTS (
    SELECT 1
    FROM "public"."CourseDegree" degree_course
    WHERE degree_course."courseId" = related_enrollment."courseId"
      AND degree_course."degreeCourseId" = degree_enrollment."courseId"
  )
LEFT JOIN "public"."Course" course_row
  ON course_row.id = related_enrollment."courseId"
LEFT JOIN "public"."Program" program_row
  ON program_row.id = course_row."programId"
WHERE degree_program_row."type" = 'DEGREES'
GROUP BY
  degree_enrollment."courseId",
  degree_enrollment."userId";

COMMENT ON VIEW "public"."DegreeParticipationStats" IS
  'Aggregated ECTS and event attendance statistics per degree participation. Discriminates on Program.type (not the editable free-text Program.shortTitle) so the numbers match the admin UI and the degree certificate requirement gate.';
