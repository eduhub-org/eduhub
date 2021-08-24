alter table "public"."Location" alter column "Link" drop not null;
alter table "public"."Location" add column "Link" text;
