-- Restore the original shortTitle-based predicates.
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
    WHERE program_row."shortTitle" = 'EVENTS'
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
WHERE degree_program_row."shortTitle" = 'DEGREES'
GROUP BY
  degree_enrollment."courseId",
  degree_enrollment."userId";

COMMENT ON VIEW "public"."DegreeParticipationStats" IS
  'Aggregated ECTS and event attendance statistics per degree participation.';
