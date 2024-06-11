comment on column "public"."CertificateTemplateText"."recordType" is E'Certificate text templates is the basis for the textual content that is dynamically generated according to the course, user enrollment data, and certificate type.';
alter table "public"."CertificateTemplateText" alter column "recordType" drop not null;
alter table "public"."CertificateTemplateText" add column "recordType" int4;
