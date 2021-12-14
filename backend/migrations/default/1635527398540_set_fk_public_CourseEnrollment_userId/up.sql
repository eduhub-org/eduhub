alter table "public"."CourseEnrollment"
  add constraint "CourseEnrollment_userId_fkey"
  foreign key ("userId")
  references "public"."User"
  ("id") on update restrict on delete restrict;
