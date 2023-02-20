alter table "public"."CourseGroup"
  add constraint "CourseGroup_groupOptionId_fkey"
  foreign key ("groupOptionId")
  references "public"."CourseGroupOption"
  ("id") on update restrict on delete restrict;
