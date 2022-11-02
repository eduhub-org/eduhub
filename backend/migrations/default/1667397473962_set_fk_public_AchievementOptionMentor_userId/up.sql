alter table "public"."AchievementOptionMentor"
  add constraint "AchievementOptionMentor_userId_fkey"
  foreign key ("userId")
  references "public"."User"
  ("id") on update restrict on delete restrict;
