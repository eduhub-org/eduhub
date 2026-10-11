ALTER TABLE "public"."Program"
  ADD COLUMN "instructorInvoiceTemplateId" integer;

ALTER TABLE "public"."Program"
  ADD CONSTRAINT "Program_instructorInvoiceTemplateId_fkey"
  FOREIGN KEY ("instructorInvoiceTemplateId") REFERENCES "public"."CertificateTemplate"("id")
  ON UPDATE RESTRICT ON DELETE SET NULL;

COMMENT ON COLUMN "public"."Program"."instructorInvoiceTemplateId" IS E'HTML template (type INSTRUCTOR_INVOICE) used to render the invoices instructors download for their share of a course fee.';
