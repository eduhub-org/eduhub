alter table "public"."Program" rename column "attendanceCertificateTemplateURL" to "achievementCertificateTemplateURL";
comment on column "public"."Program"."achievementCertificateTemplateURL" is E'The URL to the pdf template of the achievement certificate';
