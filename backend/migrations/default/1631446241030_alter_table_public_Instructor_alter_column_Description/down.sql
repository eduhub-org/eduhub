alter table "public"."Instructor" rename column "description" to "Description";
comment on column "public"."Instructor"."Description" is NULL;
