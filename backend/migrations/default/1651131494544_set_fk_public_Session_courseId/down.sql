alter table "public"."Session" drop constraint "Session_courseId_fkey",
  add constraint "Date_CourseId_fkey"
  foreign key ("courseId")
  references "public"."Course"
  ("id") on update restrict on delete restrict;
