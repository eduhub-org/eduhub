alter table "public"."CourseDegree"
  add constraint "CourseDegree_degreeCourseId_fkey"
  foreign key ("degreeCourseId")
  references "public"."Course"
  ("id") on update restrict on delete restrict;
