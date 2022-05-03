alter table "public"."ProjectEnrollment" drop constraint "ProjectEnrollment_enrollmentId_fkey",
  add constraint "ProjectEnrollment_enrollmentId_fkey"
  foreign key ("enrollmentId")
  references "public"."CourseEnrollment"
  ("id") on update cascade on delete cascade;
