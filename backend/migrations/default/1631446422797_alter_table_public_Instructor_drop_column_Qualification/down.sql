alter table "public"."Instructor" alter column "Qualification" drop not null;
alter table "public"."Instructor" add column "Qualification" text;
