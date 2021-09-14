alter table "public"."User" rename column "newsletterRegistration" to "Newsletter";
comment on column "public"."User"."Newsletter" is NULL;
