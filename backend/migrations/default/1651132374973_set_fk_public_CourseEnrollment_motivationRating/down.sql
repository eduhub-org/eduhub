alter table "public"."CourseEnrollment" drop constraint "CourseEnrollment_motivationRating_fkey",
  add constraint "Enrollment_MotivationRating_fkey"
  foreign key ("motivationRating")
  references "public"."MotivationRating"
  ("value") on update restrict on delete restrict;
