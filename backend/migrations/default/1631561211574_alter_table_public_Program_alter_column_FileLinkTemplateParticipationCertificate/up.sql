comment on column "public"."Program"."FileLinkTemplateParticipationCertificate" is E'The URL to the pdf template for the attendance certificate';
alter table "public"."Program" rename column "FileLinkTemplateParticipationCertificate" to "participationCertificateTemplateURL";
