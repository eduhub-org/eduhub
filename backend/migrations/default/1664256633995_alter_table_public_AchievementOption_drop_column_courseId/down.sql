comment on column "public"."AchievementOption"."courseId" is E'A new row can be added by an admin or instructor to then make these achievement options available in specific courses.';
alter table "public"."AchievementOption" alter column "courseId" drop not null;
alter table "public"."AchievementOption" add column "courseId" int4;
