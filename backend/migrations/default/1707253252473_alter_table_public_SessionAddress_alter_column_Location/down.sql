alter table "public"."SessionAddress" rename column "location" to "Location";
comment on column "public"."SessionAddress"."Location" is NULL;
