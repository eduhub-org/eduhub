alter table "public"."Course" alter column "Description" drop not null;
alter table "public"."Course" add column "Description" text;
