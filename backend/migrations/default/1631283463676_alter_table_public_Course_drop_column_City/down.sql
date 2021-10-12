alter table "public"."Course" alter column "City" drop not null;
alter table "public"."Course" add column "City" text;
