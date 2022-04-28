alter table "public"."CourseEnrollment" drop constraint "Enrollment_MotivationRating_fkey",
  add constraint "CourseEnrollment_motivationRating_fkey"
  foreign key ("motivationRating")
  references "public"."MotivationRating"
  ("value") on update set null on delete set null;
