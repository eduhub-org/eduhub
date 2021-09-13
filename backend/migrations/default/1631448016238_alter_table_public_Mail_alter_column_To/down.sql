alter table "public"."Mail" rename column "to" to "To";
comment on column "public"."Mail"."To" is NULL;
