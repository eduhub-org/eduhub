alter table "public"."SessionAddress" alter column "longitude" drop not null;
comment on column "public"."SessionAddress"."longitude" is E'The longitude of the address (if it is an offline location)';
