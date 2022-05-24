alter table "public"."CourseEnrollment" drop constraint "Enrollment_Status_fkey",
  add constraint "CourseEnrollment_status_fkey"
  foreign key ("status")
  references "public"."CourseEnrollmentStatus"
  ("value") on update set null on delete set null;
