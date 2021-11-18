alter table "public"."Program" rename column "visibility" to "Visibility";
comment on column "public"."Program"."Visibility" is NULL;
