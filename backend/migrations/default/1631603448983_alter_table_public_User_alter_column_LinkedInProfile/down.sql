alter table "public"."User" rename column "externalProfile" to "LinkedInProfile";
comment on column "public"."User"."LinkedInProfile" is NULL;
