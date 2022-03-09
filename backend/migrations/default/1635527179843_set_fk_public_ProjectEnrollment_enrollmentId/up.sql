alter table "public"."ProjectEnrollment"
  add constraint "ProjectEnrollment_enrollmentId_fkey"
  foreign key ("enrollmentId")
  references "public"."CourseEnrollment"
  ("id") on update restrict on delete restrict;
