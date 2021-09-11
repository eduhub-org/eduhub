alter table "public"."Course" alter column "DatesOnCertificate" drop not null;
alter table "public"."Course" add column "DatesOnCertificate" bool;
