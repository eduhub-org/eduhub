-- Count directly-registered participants towards a course's capacity.
--
-- REGISTERED means "signed up through a direct registration flow, no approval
-- step" (see 1745000000002_add_registered_status). Those people hold a seat
-- exactly as a CONFIRMED participant does, but the function omitted the status,
-- so they were invisible to every maxParticipants check.
--
-- Guest registration is what makes this bite: confirmGuestRegistration writes
-- REGISTERED, so an event with guest signup enabled could be over-subscribed
-- without limit -- the capacity guards in registerGuestForCourse and
-- confirmGuestRegistration, and the isCourseFull test on the course page, all
-- read this value.
--
-- APPLIED stays excluded on purpose: an application still awaiting a decision
-- does not hold a seat.
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
