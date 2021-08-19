alter table "public"."CourseDefaultValues" alter column "Location" drop not null;
alter table "public"."CourseDefaultValues" add column "Location" text;
