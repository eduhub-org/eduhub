comment on column "public"."SessionAddress"."longitude" is NULL;
alter table "public"."SessionAddress" alter column "longitude" set not null;
