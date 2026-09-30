-- Restore the four objects to their pre-isTest bodies.
CREATE OR REPLACE FUNCTION "public"."course_active_participant_count"(course_row "public"."Course")
RETURNS bigint
LANGUAGE sql
STABLE
AS $function$
  SELECT COUNT(*)
  FROM "public"."CourseEnrollment"
  WHERE "courseId" = course_row.id
    AND status IN ('CONFIRMED', 'INVITED', 'REGISTERED');
$function$;

CREATE OR REPLACE FUNCTION "public"."course_public_participant_count"(course_row "public"."Course")
RETURNS bigint
LANGUAGE sql
STABLE
AS $function$
  SELECT COUNT(*)
  FROM "public"."CourseEnrollment"
  WHERE "courseId" = course_row.id
    AND status IN ('CONFIRMED', 'REGISTERED');
$function$;

CREATE OR REPLACE VIEW "public"."CourseParticipant" AS
  SELECT
    "courseId",
    "userId"
  FROM "public"."CourseEnrollment"
  WHERE "status" IN ('CONFIRMED', 'COMPLETED');

COMMENT ON VIEW "public"."CourseParticipant" IS
  E'Confirmed and completed enrollments reduced to (courseId, userId), so participants of a course can be listed to one another without exposing enrollment status.';

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
