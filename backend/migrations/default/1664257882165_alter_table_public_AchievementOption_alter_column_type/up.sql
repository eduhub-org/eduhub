comment on column "public"."AchievementOption"."type" is E'Type of the achivement record that must be uploaded for this option';
alter table "public"."AchievementOption" rename column "type" to "recordType";
