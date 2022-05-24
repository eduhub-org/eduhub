alter table "public"."CourseInstructor" drop constraint "CourseInstructor_CourseId_fkey",
  add constraint "CourseInstructor_courseId_fkey"
  foreign key ("courseId")
  references "public"."Course"
  ("id") on update cascade on delete cascade;
