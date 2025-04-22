alter table "public"."CourseEnrollment" drop constraint "CourseEnrollment_userId_fkey",
  add constraint "CourseEnrollment_userId_fkey"
  foreign key ("userId")
  references "public"."User"
  ("id") on update restrict on delete restrict;
