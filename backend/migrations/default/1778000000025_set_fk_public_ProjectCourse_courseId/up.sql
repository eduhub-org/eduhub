alter table "public"."ProjectCourse"
  add constraint "ProjectCourse_courseId_fkey"
  foreign key ("courseId")
  references "public"."Course"
  ("id") on update restrict on delete restrict;
