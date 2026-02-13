-- Drop Invoice table and indexes
DROP TRIGGER IF EXISTS "set_public_Invoice_updated_at" ON "public"."Invoice";
DROP INDEX IF EXISTS "public"."Invoice_invoiceDate_idx";
DROP INDEX IF EXISTS "public"."Invoice_status_idx";
DROP INDEX IF EXISTS "public"."Invoice_courseEnrollmentId_idx";
DROP INDEX IF EXISTS "public"."Invoice_userId_idx";
DROP INDEX IF EXISTS "public"."Invoice_organizationId_idx";

DROP TABLE IF EXISTS "public"."Invoice";
