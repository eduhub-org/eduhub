alter table "public"."Project" alter column "Description" drop not null;
comment on column "public"."Project"."Description" is E'A description of the project.';
alter table "public"."Project" rename column "Description" to "description";
