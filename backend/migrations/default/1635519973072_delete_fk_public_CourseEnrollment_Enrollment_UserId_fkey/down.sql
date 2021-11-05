alter table "public"."CourseEnrollment"
  add constraint "Enrollment_UserId_fkey"
  foreign key ("userId")
  references "public"."User"
  ("id") on update restrict on delete restrict;
