alter table "public"."CourseLocation" drop constraint "CourseAddress_courseId_fkey",
  add constraint "CourseLocation_courseId_fkey"
  foreign key ("courseId")
  references "public"."Course"
  ("id") on update cascade on delete cascade;
