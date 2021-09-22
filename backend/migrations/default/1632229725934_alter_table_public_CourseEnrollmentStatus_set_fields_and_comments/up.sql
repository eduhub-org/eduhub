UPDATE "public"."CourseEnrollmentStatus" SET comment = E'The course application was received.' WHERE value = E'APPLIED';
UPDATE "public"."CourseEnrollmentStatus" SET comment = E'The application was rejected.' WHERE value = E'REJECTED';
UPDATE "public"."CourseEnrollmentStatus" SET comment = E'Invitation was sent to Student.' WHERE value = E'INVITED';
UPDATE "public"."CourseEnrollmentStatus" SET comment = E'The invitation to the course has expired.' WHERE value = E'EXPIRED';
UPDATE "public"."CourseEnrollmentStatus" SET comment = E'The course invitation was confirmed by the student.' WHERE value = E'CONFIRMED';
UPDATE "public"."CourseEnrollmentStatus" SET comment = E'The course was not successfully completed.' WHERE value = E'ABORTED';
UPDATE "public"."CourseEnrollmentStatus" SET comment = E'The course was successfully completed by receiving at least one certificate.' WHERE value = E'COMPLETED';
