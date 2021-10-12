alter table "public"."Course" alter column "TextOnCertificate" drop not null;
alter table "public"."Course" add column "TextOnCertificate" text;
