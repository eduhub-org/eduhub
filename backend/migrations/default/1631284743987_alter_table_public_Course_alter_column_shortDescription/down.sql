alter table "public"."Course" rename column "tagline" to "shortDescription";
comment on column "public"."Course"."shortDescription" is NULL;
