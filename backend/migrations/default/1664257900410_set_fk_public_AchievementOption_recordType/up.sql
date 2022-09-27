alter table "public"."AchievementOption"
  add constraint "AchievementOption_recordType_fkey"
  foreign key ("recordType")
  references "public"."AchievementRecordType"
  ("value") on update restrict on delete restrict;
