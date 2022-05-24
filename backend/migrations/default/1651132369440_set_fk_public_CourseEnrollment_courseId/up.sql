alter table "public"."CourseEnrollment" drop constraint "Enrollment_CourseId_fkey",
  add constraint "CourseEnrollment_courseId_fkey"
  foreign key ("courseId")
  references "public"."Course"
  ("id") on update cascade on delete cascade;
