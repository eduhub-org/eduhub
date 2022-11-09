comment on column "public"."AchievementOptionMentor"."expertId" is E'A new row is added for each expert added as mentor to an achievement option.';
alter table "public"."AchievementOptionMentor" alter column "expertId" drop not null;
alter table "public"."AchievementOptionMentor" add column "expertId" int4;
