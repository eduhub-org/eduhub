alter table "public"."Project" rename column "description" to "Description";
comment on column "public"."Project"."Description" is NULL;
alter table "public"."Project" alter column "Description" set not null;
