comment on column "public"."AchievementRecord"."uploadUser" is E'A new row is created whenever a user uploads a new record for an achievement option.';
alter table "public"."AchievementRecord" alter column "uploadUser" drop not null;
alter table "public"."AchievementRecord" add column "uploadUser" int4;
