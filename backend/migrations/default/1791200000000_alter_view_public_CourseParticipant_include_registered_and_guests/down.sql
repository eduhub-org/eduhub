CREATE OR REPLACE VIEW "public"."CourseParticipant" AS
  SELECT
    "courseId",
    "userId"
  FROM "public"."CourseEnrollment"
  WHERE "status" IN ('CONFIRMED', 'COMPLETED')
    AND NOT "isTest";

COMMENT ON VIEW "public"."CourseParticipant" IS
  E'Confirmed and completed enrollments reduced to (courseId, userId), so participants of a course can be listed to one another without exposing enrollment status. Preview enrollments (isTest) are excluded.';
