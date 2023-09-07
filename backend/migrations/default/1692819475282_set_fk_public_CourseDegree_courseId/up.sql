alter table "public"."CourseDegree"
  add constraint "CourseDegree_courseId_fkey"
  foreign key ("courseId")
  references "public"."Course"
  ("id") on update restrict on delete restrict;
