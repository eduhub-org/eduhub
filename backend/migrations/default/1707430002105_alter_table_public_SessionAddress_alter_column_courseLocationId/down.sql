comment on column "public"."SessionAddress"."courseLocationId" is NULL;
alter table "public"."SessionAddress" drop constraint "SessionAddress_courseLocationId_key";
