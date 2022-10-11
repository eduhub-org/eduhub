alter table "public"."AchievementRecord"
  add constraint "AchievementRecord_AchievementOptionId_fkey"
  foreign key ("AchievementOptionId")
  references "public"."AchievementOption"
  ("id") on update restrict on delete restrict;
