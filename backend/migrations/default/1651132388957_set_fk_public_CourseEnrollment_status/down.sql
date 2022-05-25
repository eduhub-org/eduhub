alter table "public"."CourseEnrollment" drop constraint "CourseEnrollment_status_fkey",
  add constraint "Enrollment_Status_fkey"
  foreign key ("status")
  references "public"."CourseEnrollmentStatus"
  ("value") on update restrict on delete restrict;
