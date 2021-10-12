alter table "public"."User" rename column "authId" to "AuthId";
comment on column "public"."User"."AuthId" is NULL;
