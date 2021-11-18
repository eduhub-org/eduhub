alter table "public"."User" rename column "picture" to "Image";
comment on column "public"."User"."Image" is NULL;
