alter table "public"."User" rename column "university" to "University";
comment on column "public"."User"."University" is NULL;
