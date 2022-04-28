alter table "public"."CourseProject" drop constraint "CourseProject_courseId_fkey",
  add constraint "CourseProject_courseId_fkey"
  foreign key ("courseId")
  references "public"."Course"
  ("id") on update cascade on delete cascade;
