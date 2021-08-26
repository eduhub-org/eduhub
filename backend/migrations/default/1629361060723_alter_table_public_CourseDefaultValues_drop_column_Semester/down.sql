alter table "public"."CourseDefaultValues" alter column "Semester" drop not null;
alter table "public"."CourseDefaultValues" add column "Semester" int4;
