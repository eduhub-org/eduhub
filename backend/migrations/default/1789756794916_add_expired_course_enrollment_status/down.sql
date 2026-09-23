-- Existing expired invitations become pending invitations again.
UPDATE "public"."CourseEnrollment"
SET "status" = 'INVITED'
WHERE "status" = 'EXPIRED';

DELETE FROM "public"."CourseEnrollmentStatus"
WHERE "value" = 'EXPIRED';
