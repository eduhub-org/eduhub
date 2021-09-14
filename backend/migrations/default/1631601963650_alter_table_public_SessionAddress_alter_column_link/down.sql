comment on column "public"."SessionAddress"."link" is NULL;
alter table "public"."SessionAddress" alter column "link" set not null;
