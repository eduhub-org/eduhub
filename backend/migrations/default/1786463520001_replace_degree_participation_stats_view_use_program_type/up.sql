-- The frontend (and, as of this release, the degree certificate generator)
-- discriminates programs on Program.type, whose values are exactly
-- COURSES / EVENTS / DEGREES. This view used Program."shortTitle", an editable
-- free-text label: an organization that renames its programs silently loses its
-- degree statistics (no row at all for a renamed DEGREES program, zero events for a
-- renamed EVENTS program). Since the certificate requirement gate is checked
-- against the same rule these numbers express, the two must not be able to
-- disagree.
--
-- Program.type is authoritative, but "shortTitle" is still honoured as a fallback:
-- migration 1734993470424 added the column with DEFAULT 'COURSES' and nothing ever
-- backfilled it from the old label, and no admin screen can edit it. A program that
-- was missed back then still says COURSES, so accepting either signal keeps this
-- view a superset of both its old and its new behaviour - no participant can lose
-- statistics because of this migration. Drop the fallback once Program.type is known
-- to be correct everywhere (that is a data fix with admin-visible side effects: it
-- also decides which management page a program appears on and which org-admin
-- capability governs it).
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
       OR program_row."shortTitle" = 'EVENTS'
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
   OR degree_program_row."shortTitle" = 'DEGREES'
GROUP BY
  degree_enrollment."courseId",
  degree_enrollment."userId";

COMMENT ON VIEW "public"."DegreeParticipationStats" IS
  'Aggregated ECTS and event attendance statistics per degree participation. Discriminates on Program.type, which is what the admin UI and the degree certificate requirement gate use, and still accepts the legacy free-text Program.shortTitle so programs predating the type column keep their statistics.';
