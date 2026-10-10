ALTER TABLE "public"."Program" DROP CONSTRAINT IF EXISTS "Program_instructorInvoiceTemplateId_fkey";
ALTER TABLE "public"."Program" DROP COLUMN IF EXISTS "instructorInvoiceTemplateId";
