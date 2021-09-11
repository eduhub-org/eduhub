alter table "public"."Course" alter column "projects" drop not null;
alter table "public"."Course" add column "projects" text;
