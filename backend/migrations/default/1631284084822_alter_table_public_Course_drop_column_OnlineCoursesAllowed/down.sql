alter table "public"."Course" alter column "OnlineCoursesAllowed" drop not null;
alter table "public"."Course" add column "OnlineCoursesAllowed" bool;
