alter table "public"."Course" alter column "ExternalProjectsAllowed" drop not null;
alter table "public"."Course" add column "ExternalProjectsAllowed" bool;
