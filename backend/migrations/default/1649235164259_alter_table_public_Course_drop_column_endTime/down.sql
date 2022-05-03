comment on column "public"."Course"."endTime" is E'New courses are added by admins only and belong to exactly one program. Most of the columns can be set by the instructor and the admin.';
alter table "public"."Course" alter column "endTime" drop not null;
alter table "public"."Course" add column "endTime" timetz;
