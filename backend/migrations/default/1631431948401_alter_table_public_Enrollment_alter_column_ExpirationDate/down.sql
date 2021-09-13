alter table "public"."Enrollment" rename column "invitationExpirationDate" to "ExpirationDate";
comment on column "public"."Enrollment"."ExpirationDate" is NULL;
