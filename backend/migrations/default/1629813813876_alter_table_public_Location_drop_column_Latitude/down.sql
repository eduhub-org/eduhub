alter table "public"."Location" alter column "Latitude" drop not null;
alter table "public"."Location" add column "Latitude" text;
