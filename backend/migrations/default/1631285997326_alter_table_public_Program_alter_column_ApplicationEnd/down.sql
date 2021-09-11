alter table "public"."Program" rename column "defaultApplicationEndDateTime" to "ApplicationEnd";
comment on column "public"."Program"."ApplicationEnd" is NULL;
