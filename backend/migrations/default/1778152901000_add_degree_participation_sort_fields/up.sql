CREATE FUNCTION "public"."degree_participation_ects_total"(enrollment_row "public"."CourseEnrollment")
RETURNS numeric
LANGUAGE sql
STABLE
AS $function$
  SELECT COALESCE(
    SUM(
      CASE
        WHEN REPLACE(course_row.ects, ',', '.') ~ '^[0-9]+(\.[0-9]+)?$'
          THEN REPLACE(course_row.ects, ',', '.')::numeric
        ELSE 0
      END
    ),
    0
  )
  FROM "public"."CourseEnrollment" related_enrollment
  JOIN "public"."Course" course_row
    ON course_row.id = related_enrollment."courseId"
  JOIN "public"."CourseDegree" degree_course
    ON degree_course."courseId" = course_row.id
  WHERE related_enrollment."userId" = enrollment_row."userId"
    AND related_enrollment."achievementCertificateURL" IS NOT NULL
    AND degree_course."degreeCourseId" = enrollment_row."courseId";
$function$;

CREATE FUNCTION "public"."degree_participation_attended_event_count"(enrollment_row "public"."CourseEnrollment")
RETURNS bigint
LANGUAGE sql
STABLE
AS $function$
  SELECT COUNT(*)
  FROM "public"."CourseEnrollment" related_enrollment
  JOIN "public"."Course" course_row
    ON course_row.id = related_enrollment."courseId"
  JOIN "public"."Program" program_row
    ON program_row.id = course_row."programId"
  JOIN "public"."CourseDegree" degree_course
    ON degree_course."courseId" = course_row.id
  WHERE related_enrollment."userId" = enrollment_row."userId"
    AND program_row."shortTitle" = 'EVENTS'
    AND degree_course."degreeCourseId" = enrollment_row."courseId";
$function$;
