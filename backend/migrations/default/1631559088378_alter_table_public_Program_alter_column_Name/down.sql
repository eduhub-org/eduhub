alter table "public"."Program" rename column "title" to "Name";
comment on column "public"."Program"."Name" is NULL;
