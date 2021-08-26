alter table "public"."Course" alter column "Duration" drop not null;
alter table "public"."Course" add column "Duration" int4;
