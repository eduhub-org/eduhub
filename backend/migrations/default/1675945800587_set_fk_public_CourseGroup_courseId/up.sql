alter table "public"."CourseGroup"
  add constraint "CourseGroup_courseId_fkey"
  foreign key ("courseId")
  references "public"."Course"
  ("id") on update restrict on delete restrict;
