alter table "public"."Project" alter column "description_field2" drop not null;
comment on column "public"."Project"."description_field2" is E'Content of the first project description field';
