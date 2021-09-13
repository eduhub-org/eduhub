comment on column "public"."Program"."achievementCertificateTemplateURL" is E'The URL to the pdf template for the attendance certificate';
alter table "public"."Program" rename column "achievementCertificateTemplateURL" to "attendanceCertificateTemplateURL";
