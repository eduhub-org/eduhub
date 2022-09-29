alter table "public"."AchievementOption" rename column "recordType" to "type";
comment on column "public"."AchievementOption"."type" is NULL;
