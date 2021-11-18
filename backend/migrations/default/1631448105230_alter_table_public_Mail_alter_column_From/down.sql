alter table "public"."Mail" rename column "from" to "From";
comment on column "public"."Mail"."From" is NULL;
