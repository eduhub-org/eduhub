alter table "public"."User" rename column "anonymousId" to "AnonymId";
comment on column "public"."User"."AnonymId" is NULL;
