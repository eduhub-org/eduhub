-- List directly-registered people, guests among them, in the participant
-- directory, and say which of them are guests.
--
-- REGISTERED is how every direct-signup flow enrolls someone, including
-- confirmGuestRegistration, so a guest at an event never reached the "Who's
-- here" list, nor did anyone who signed up for an event with their own account.
-- They hold a seat exactly like a CONFIRMED participant (see
-- course_active_participant_count), so they belong in the list.
--
-- isGuest lets the directory mark guests without opening User.status to fellow
-- participants. Anonymized users (status DELETED) are left out: their name is
-- gone, so listing "ANON_USER" says nothing about who is here.
--
-- The new column is appended last, as CREATE OR REPLACE VIEW requires.
CREATE OR REPLACE VIEW "public"."CourseParticipant" AS
  SELECT
    enrollment."courseId",
    enrollment."userId",
    (participant.status = 'GUEST') AS "isGuest"
  FROM "public"."CourseEnrollment" enrollment
  JOIN "public"."User" participant
    ON participant.id = enrollment."userId"
  WHERE enrollment."status" IN ('CONFIRMED', 'COMPLETED', 'REGISTERED')
    AND NOT enrollment."isTest"
    AND participant.status <> 'DELETED';

COMMENT ON VIEW "public"."CourseParticipant" IS
  E'Confirmed, completed and directly registered enrollments reduced to (courseId, userId, isGuest), so participants of a course can be listed to one another without exposing enrollment or user status. Preview enrollments (isTest) and anonymized users are excluded.';
