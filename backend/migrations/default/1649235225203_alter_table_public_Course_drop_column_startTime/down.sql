comment on column "public"."Course"."startTime" is E'New courses are added by admins only and belong to exactly one program. Most of the columns can be set by the instructor and the admin.';
alter table "public"."Course" alter column "startTime" drop not null;
alter table "public"."Course" add column "startTime" timetz;
