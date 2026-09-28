-- Keep preview enrollments (CourseEnrollment."isTest") out of every number and
-- every list that describes who is taking part in a course.
--
-- Doing it here rather than in each caller is deliberate: these four objects are
-- what the public course page, the capacity guards, the participant directory
-- and the degree certificate gate all read, so excluding the rows once at the
-- source means a preview cannot leak into any of them by omission.

-- Capacity. A preview holds no seat, so maxParticipants is unaffected and no one
-- is pushed onto the waitlist by an instructor looking at their own course.
CREATE OR REPLACE FUNCTION "public"."course_active_participant_count"(course_row "public"."Course")
RETURNS bigint
LANGUAGE sql
STABLE
AS $function$
  SELECT COUNT(*)
  FROM "public"."CourseEnrollment"
  WHERE "courseId" = course_row.id
    AND status IN ('CONFIRMED', 'INVITED', 'REGISTERED')
    AND NOT "isTest";
$function$;

-- The participant number the public course page states.
CREATE OR REPLACE FUNCTION "public"."course_public_participant_count"(course_row "public"."Course")
RETURNS bigint
LANGUAGE sql
STABLE
AS $function$
  SELECT COUNT(*)
  FROM "public"."CourseEnrollment"
  WHERE "courseId" = course_row.id
    AND status IN ('CONFIRMED', 'REGISTERED')
    AND NOT "isTest";
$function$;

-- The participant directory one participant may read about the others. An
-- instructor previewing their own course must not appear in it.
CREATE OR REPLACE VIEW "public"."CourseParticipant" AS
  SELECT
    "courseId",
    "userId"
  FROM "public"."CourseEnrollment"
  WHERE "status" IN ('CONFIRMED', 'COMPLETED')
    AND NOT "isTest";

COMMENT ON VIEW "public"."CourseParticipant" IS
  E'Confirmed and completed enrollments reduced to (courseId, userId), so participants of a course can be listed to one another without exposing enrollment status. Preview enrollments (isTest) are excluded.';

-- Degree statistics. Excluded on both sides: a preview of a degree course must
-- neither produce a participation row of its own, nor contribute ECTS or an
-- attended event to one.
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
  AND NOT related_enrollment."isTest"
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
  AND NOT degree_enrollment."isTest"
GROUP BY
  degree_enrollment."courseId",
  degree_enrollment."userId";

COMMENT ON VIEW "public"."DegreeParticipationStats" IS
  'Aggregated ECTS and event attendance statistics per degree participation. Discriminates on Program.type (not the editable free-text Program.shortTitle) so the numbers match the admin UI and the degree certificate requirement gate. Preview enrollments (isTest) are excluded on both sides.';
