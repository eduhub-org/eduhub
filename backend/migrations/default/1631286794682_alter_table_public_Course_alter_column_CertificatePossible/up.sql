comment on column "public"."Course"."CertificatePossible" is E'If the course is offering ECTS, this certificate must be possible to obtain.';
alter table "public"."Course" rename column "CertificatePossible" to "performanceCertificatePossible";
