alter table "public"."Instructor" alter column "WantsToContinue" drop not null;
alter table "public"."Instructor" add column "WantsToContinue" bool;
