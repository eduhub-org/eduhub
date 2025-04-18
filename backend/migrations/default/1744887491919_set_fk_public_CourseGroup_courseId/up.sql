alter table "public"."CourseGroup" drop constraint "CourseGroup_courseId_fkey",
  add constraint "CourseGroup_courseId_fkey"
  foreign key ("courseId")
  references "public"."Course"
  ("id") on update cascade on delete cascade;
