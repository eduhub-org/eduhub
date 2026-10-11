CREATE TABLE "public"."CertificateTemplateType" (
  "value"   text NOT NULL,
  "comment" text,
  PRIMARY KEY ("value")
);

COMMENT ON TABLE "public"."CertificateTemplateType" IS E'Kind of document a CertificateTemplate renders (participant certificate, instructor invoice, instructor certificate).';

INSERT INTO "public"."CertificateTemplateType" ("value", "comment") VALUES
  ('PARTICIPANT_CERTIFICATE', 'Attendance, achievement or degree certificate for participants'),
  ('INSTRUCTOR_INVOICE', 'Invoice an instructor submits for their share of the course fee'),
  ('INSTRUCTOR_CERTIFICATE', 'Certificate confirming that a person instructed a course');

ALTER TABLE "public"."CertificateTemplate"
  ADD COLUMN "type" text NOT NULL DEFAULT 'PARTICIPANT_CERTIFICATE';

ALTER TABLE "public"."CertificateTemplate"
  ADD CONSTRAINT "CertificateTemplate_type_fkey"
  FOREIGN KEY ("type") REFERENCES "public"."CertificateTemplateType"("value")
  ON UPDATE CASCADE ON DELETE RESTRICT;

COMMENT ON COLUMN "public"."CertificateTemplate"."type" IS E'Kind of document this template renders; selectors only offer templates of the matching type.';
