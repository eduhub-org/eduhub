alter table "public"."Course" rename column "contentDescriptionField1" to "ContentTextField1";
comment on column "public"."Course"."ContentTextField1" is NULL;
