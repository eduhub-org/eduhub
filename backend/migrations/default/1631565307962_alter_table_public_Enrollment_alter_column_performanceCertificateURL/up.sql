comment on column "public"."Enrollment"."performanceCertificateURL" is E'URL to the file containing the user\'s achievement certificate (if he obtained one)';
alter table "public"."Enrollment" rename column "performanceCertificateURL" to "achievementCertificateURL";
