alter table "public"."CourseLocation" drop constraint "CourseLocation_courseId_fkey",
  add constraint "CourseAddress_courseId_fkey"
  foreign key ("courseId")
  references "public"."Course"
  ("id") on update restrict on delete restrict;
