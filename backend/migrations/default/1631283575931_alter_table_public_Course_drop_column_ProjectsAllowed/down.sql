alter table "public"."Course" alter column "ProjectsAllowed" drop not null;
alter table "public"."Course" add column "ProjectsAllowed" bool;
