-- The participant number the public course page states.
--
-- Deliberately not course_active_participant_count: that one answers "how many
-- seats are taken", so it counts INVITED, someone holding a seat they have not
-- accepted yet. Naming them publicly as participants overstates the case - they
-- may never turn up - so this counts only people who have actually taken their
-- place: CONFIRMED, and REGISTERED for the direct-signup flows.
--
-- COMPLETED is excluded so the number does not change meaning once a course
-- ends, and APPLIED for the same reason as in the capacity function: an
-- undecided application is not participation.
--
-- The two are kept apart on purpose. Capacity keeps counting INVITED, so a
-- course can read "18 participants" while being full at 20 - which is correct:
-- two seats are held, not taken.
CREATE FUNCTION "public"."course_public_participant_count"(course_row "public"."Course")
RETURNS bigint
LANGUAGE sql
STABLE
AS $function$
  SELECT COUNT(*)
  FROM "public"."CourseEnrollment"
  WHERE "courseId" = course_row.id
    AND status IN ('CONFIRMED', 'REGISTERED');
$function$;
