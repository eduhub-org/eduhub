UPDATE "public"."CourseEnrollment"
SET "status" = (
  SELECT "value"
  FROM "public"."CourseEnrollmentStatus"
  WHERE "value" = 'APPLIED'
)
WHERE "status" = 'WAITLIST';

DELETE FROM "public"."CourseEnrollmentStatus"
WHERE "value" = 'WAITLIST';
