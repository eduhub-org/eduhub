alter table "public"."Program" rename column "applicationStart" to "ApplicationStart";
comment on column "public"."Program"."ApplicationStart" is NULL;
