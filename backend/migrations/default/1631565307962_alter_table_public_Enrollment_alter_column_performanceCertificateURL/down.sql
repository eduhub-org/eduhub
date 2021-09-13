alter table "public"."Enrollment" rename column "achievementCertificateURL" to "performanceCertificateURL";
comment on column "public"."Enrollment"."performanceCertificateURL" is E'URL to the file containing the user\'s prformance certificate (if he obtained one)';
