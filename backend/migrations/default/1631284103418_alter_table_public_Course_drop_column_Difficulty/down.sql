alter table "public"."Course" alter column "Difficulty" drop not null;
alter table "public"."Course" add column "Difficulty" int4;
