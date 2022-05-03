alter table "public"."Session" drop constraint "Date_CourseId_fkey",
  add constraint "Session_courseId_fkey"
  foreign key ("courseId")
  references "public"."Course"
  ("id") on update cascade on delete cascade;
