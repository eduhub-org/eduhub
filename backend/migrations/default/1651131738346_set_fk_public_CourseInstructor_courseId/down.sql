alter table "public"."CourseInstructor" drop constraint "CourseInstructor_courseId_fkey",
  add constraint "CourseInstructor_CourseId_fkey"
  foreign key ("courseId")
  references "public"."Course"
  ("id") on update restrict on delete restrict;
