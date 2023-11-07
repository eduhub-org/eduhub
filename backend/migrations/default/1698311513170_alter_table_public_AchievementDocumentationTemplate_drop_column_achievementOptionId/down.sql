comment on column "public"."AchievementDocumentationTemplate"."achievementOptionId" is E'Contains Templates to be used by course participants to complete their achievements';
alter table "public"."AchievementDocumentationTemplate" alter column "achievementOptionId" drop not null;
alter table "public"."AchievementDocumentationTemplate" add column "achievementOptionId" int4;
