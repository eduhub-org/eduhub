alter table "public"."CourseEnrollment" drop constraint "CourseEnrollment_courseId_fkey",
  add constraint "Enrollment_CourseId_fkey"
  foreign key ("courseId")
  references "public"."Course"
  ("id") on update restrict on delete restrict;
