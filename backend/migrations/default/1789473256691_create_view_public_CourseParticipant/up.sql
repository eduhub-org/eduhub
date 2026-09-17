-- Who counts as a participant of a course, as a surface a fellow participant
-- may read.
--
-- CourseEnrollment itself cannot serve this: its `user_access_others`
-- permission deliberately exposes only (id, courseId, userId) with no row
-- filter, precisely so that one logged-in user cannot read another's
-- application status (b7b6f8bb). Selecting `status` there would undo that for
-- every enrollment in the system. This view answers the narrower question -
-- "is this user taking part" - and carries no status column at all, so the
-- participant directory needs no loosening of CourseEnrollment.
CREATE OR REPLACE VIEW "public"."CourseParticipant" AS
  SELECT
    "courseId",
    "userId"
  FROM "public"."CourseEnrollment"
  WHERE "status" IN ('CONFIRMED', 'COMPLETED');

COMMENT ON VIEW "public"."CourseParticipant" IS
  E'Confirmed and completed enrollments reduced to (courseId, userId), so participants of a course can be listed to one another without exposing enrollment status.';
