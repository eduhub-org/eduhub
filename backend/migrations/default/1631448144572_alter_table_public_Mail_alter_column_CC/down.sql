alter table "public"."Mail" rename column "cc" to "CC";
comment on column "public"."Mail"."CC" is NULL;
