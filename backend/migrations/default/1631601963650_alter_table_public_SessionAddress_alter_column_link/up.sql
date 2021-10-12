alter table "public"."SessionAddress" alter column "link" drop not null;
comment on column "public"."SessionAddress"."link" is E'The longitude of the address (if it is an offline location)';
