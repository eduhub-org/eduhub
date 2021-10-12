comment on column "public"."Enrollment"."ExpirationDate" is E'The last date a user can confirm his/her invitation to a course';
alter table "public"."Enrollment" rename column "ExpirationDate" to "invitationExpirationDate";
