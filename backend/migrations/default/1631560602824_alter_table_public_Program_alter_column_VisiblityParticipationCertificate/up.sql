comment on column "public"."Program"."VisiblityParticipationCertificate" is E'Sets the participation certificates for all courses of htis program to be visible for the recipients.';
alter table "public"."Program" rename column "VisiblityParticipationCertificate" to "visiblityParticipationCertificate";
