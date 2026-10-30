-- No more people can hold a place in a course than it has places. A direct
-- registration was already capped (course_enrollment_guard_participant_changes),
-- but invitations, which only organizers send, were not: the "send by rating"
-- button invited everyone rated green, however few places were left.
--
-- Every invitation that takes a new place - from APPLIED, WAITLIST, EXPIRED or
-- a fresh insert - now needs a free one, whoever sends it, including admins.
-- Extending an invitation that is still INVITED takes no new place. The places
-- taken are counted like course_active_participant_count. A BEFORE row trigger
-- sees the rows its statement already updated, so a bulk invitation is counted
-- row by row and fails as a whole once the course would be over-full.
CREATE OR REPLACE FUNCTION "public"."course_enrollment_guard_invitation_capacity"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  max_participants integer;
  active_count bigint;
BEGIN
  IF NEW."isTest" OR (TG_OP = 'UPDATE' AND OLD.status IN ('CONFIRMED', 'INVITED', 'REGISTERED')) THEN
    RETURN NEW;
  END IF;

  SELECT "maxParticipants" INTO max_participants
    FROM "public"."Course"
    WHERE id = NEW."courseId";
  IF max_participants IS NULL THEN
    RETURN NEW;
  END IF;

  -- Same lock as the direct registration guard, so invitations and
  -- registrations for one course cannot both take the last place.
  PERFORM pg_advisory_xact_lock(hashtext('CourseEnrollmentCapacity'), NEW."courseId");
  SELECT COUNT(*) INTO active_count
    FROM "public"."CourseEnrollment"
    WHERE "courseId" = NEW."courseId"
      AND status IN ('CONFIRMED', 'INVITED', 'REGISTERED')
      AND NOT "isTest";
  IF active_count >= max_participants THEN
    RAISE EXCEPTION 'This course is full'
      USING ERRCODE = 'check_violation', HINT = 'enrollment_guard';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "course_enrollment_guard_invitation_capacity"
BEFORE INSERT OR UPDATE OF status ON "public"."CourseEnrollment"
FOR EACH ROW
WHEN (NEW.status = 'INVITED')
EXECUTE PROCEDURE "public"."course_enrollment_guard_invitation_capacity"();
