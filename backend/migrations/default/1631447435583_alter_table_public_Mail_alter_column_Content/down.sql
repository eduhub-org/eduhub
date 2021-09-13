alter table "public"."Mail" rename column "content" to "Content";
comment on column "public"."Mail"."Content" is NULL;
