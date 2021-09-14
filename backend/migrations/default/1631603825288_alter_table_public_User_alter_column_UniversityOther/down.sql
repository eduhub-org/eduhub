alter table "public"."User" rename column "otherUniversity" to "UniversityOther";
comment on column "public"."User"."UniversityOther" is NULL;
