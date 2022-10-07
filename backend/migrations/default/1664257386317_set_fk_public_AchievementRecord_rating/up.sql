alter table "public"."AchievementRecord"
  add constraint "AchievementRecord_rating_fkey"
  foreign key ("rating")
  references "public"."AchievementRecordRating"
  ("value") on update restrict on delete restrict;
