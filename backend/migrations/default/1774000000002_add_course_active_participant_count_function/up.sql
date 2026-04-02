CREATE FUNCTION "public"."course_active_participant_count"(course_row "public"."Course")
RETURNS bigint
LANGUAGE sql
STABLE
AS $function$
  SELECT COUNT(*)
  FROM "public"."CourseEnrollment"
  WHERE "courseId" = course_row.id
    AND status IN ('CONFIRMED', 'INVITED');
$function$;
