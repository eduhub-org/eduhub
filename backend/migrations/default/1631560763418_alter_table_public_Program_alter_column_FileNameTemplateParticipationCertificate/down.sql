alter table "public"."Program" rename column "achievementCertificateTemplateURL" to "FileNameTemplateParticipationCertificate";
comment on column "public"."Program"."FileNameTemplateParticipationCertificate" is NULL;
