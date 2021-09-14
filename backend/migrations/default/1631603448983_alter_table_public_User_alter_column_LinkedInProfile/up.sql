comment on column "public"."User"."LinkedInProfile" is E'A link to an external profile, for example in LinkedIn or Xing';
alter table "public"."User" rename column "LinkedInProfile" to "externalProfile";
