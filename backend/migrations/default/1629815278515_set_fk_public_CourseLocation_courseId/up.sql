alter table "public"."CourseLocation"
  add constraint "CourseLocation_courseId_fkey"
  foreign key ("courseId")
  references "public"."Course"
  ("Id") on update restrict on delete restrict;
