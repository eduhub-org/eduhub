alter table "public"."Course" rename column "headingDescriptionField1" to "titleTextField1";
comment on column "public"."Course"."titleTextField1" is NULL;
