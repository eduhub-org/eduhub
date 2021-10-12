alter table "public"."Course" rename column "chatLink" to "LinkChat";
comment on column "public"."Course"."LinkChat" is NULL;
