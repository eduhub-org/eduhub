alter table "public"."AchievementOptionCourse"
  add constraint "AchievementOptionCourse_achievementOptionId_fkey"
  foreign key ("achievementOptionId")
  references "public"."AchievementOption"
  ("id") on update restrict on delete restrict;
