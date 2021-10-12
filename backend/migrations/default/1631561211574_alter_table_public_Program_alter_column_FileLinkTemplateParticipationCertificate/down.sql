alter table "public"."Program" rename column "participationCertificateTemplateURL" to "FileLinkTemplateParticipationCertificate";
comment on column "public"."Program"."FileLinkTemplateParticipationCertificate" is NULL;
