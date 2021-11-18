alter table "public"."Course" rename column "visibility" to "Visibility";
comment on column "public"."Course"."Visibility" is NULL;
