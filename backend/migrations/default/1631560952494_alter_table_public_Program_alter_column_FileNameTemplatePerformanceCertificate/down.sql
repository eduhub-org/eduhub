alter table "public"."Program" rename column "achievementCertificateTemplateURL" to "FileNameTemplatePerformanceCertificate";
comment on column "public"."Program"."FileNameTemplatePerformanceCertificate" is NULL;
