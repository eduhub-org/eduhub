ALTER TABLE "public"."CertificateTemplate" DROP CONSTRAINT IF EXISTS "CertificateTemplate_type_fkey";
ALTER TABLE "public"."CertificateTemplate" DROP COLUMN IF EXISTS "type";
DROP TABLE IF EXISTS "public"."CertificateTemplateType";
