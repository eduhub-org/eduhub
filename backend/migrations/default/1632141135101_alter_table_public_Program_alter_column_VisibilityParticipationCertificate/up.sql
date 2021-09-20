comment on column "public"."Program"."VisibilityParticipationCertificate" is E'Sets the participation certificates for all courses of htis program to be visible for the recipients.';
alter table "public"."Program" rename column "VisibilityParticipationCertificate" to "visibilityParticipationCertificate";
