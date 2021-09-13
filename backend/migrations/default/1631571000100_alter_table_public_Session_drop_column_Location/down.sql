comment on column "public"."Session"."Location" is E'Includes all information about the individual sessions in a course.';
alter table "public"."Session" alter column "Location" drop not null;
alter table "public"."Session" add column "Location" text;
