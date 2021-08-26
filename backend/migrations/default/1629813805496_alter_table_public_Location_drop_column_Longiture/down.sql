alter table "public"."Location" alter column "Longiture" drop not null;
alter table "public"."Location" add column "Longiture" text;
