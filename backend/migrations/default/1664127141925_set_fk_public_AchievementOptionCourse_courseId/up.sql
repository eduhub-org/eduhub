alter table "public"."AchievementOptionCourse"
  add constraint "AchievementOptionCourse_courseId_fkey"
  foreign key ("courseId")
  references "public"."Course"
  ("id") on update restrict on delete restrict;
