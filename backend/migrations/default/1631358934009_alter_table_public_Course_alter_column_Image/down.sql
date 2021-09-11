alter table "public"."Course" rename column "coverImage" to "Image";
comment on column "public"."Course"."Image" is NULL;
