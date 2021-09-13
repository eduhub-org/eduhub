comment on column "public"."Program"."FileNameTemplateParticipationCertificate" is E'The URL to the pdf template of the achievement certificate';
alter table "public"."Program" rename column "FileNameTemplateParticipationCertificate" to "achievementCertificateTemplateURL";
