alter table "public"."Course" alter column "CourseType" drop not null;
alter table "public"."Course" add column "CourseType" int4;
