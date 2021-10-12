alter table "public"."Course" alter column "LinkVideoCall" drop not null;
alter table "public"."Course" add column "LinkVideoCall" text;
