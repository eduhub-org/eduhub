alter table "public"."AchievementOptionMentor"
  add constraint "AchievementOptionMentor_expertId_fkey"
  foreign key ("expertId")
  references "public"."Expert"
  ("id") on update restrict on delete restrict;
