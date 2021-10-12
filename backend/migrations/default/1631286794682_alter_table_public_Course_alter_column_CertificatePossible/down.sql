alter table "public"."Course" rename column "performanceCertificatePossible" to "CertificatePossible";
comment on column "public"."Course"."CertificatePossible" is NULL;
