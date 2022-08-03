comment on column "public"."Teacher"."schoolId" is E'a teacher that has enrolled into rent-a-scientist';
alter table "public"."Teacher" alter column "schoolId" drop not null;
alter table "public"."Teacher" add column "schoolId" text;
