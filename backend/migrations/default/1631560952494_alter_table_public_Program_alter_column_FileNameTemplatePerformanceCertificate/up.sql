comment on column "public"."Program"."FileNameTemplatePerformanceCertificate" is E'The URL to the pdf template for the attendance certificate';
alter table "public"."Program" rename column "FileNameTemplatePerformanceCertificate" to "achievementCertificateTemplateURL";
