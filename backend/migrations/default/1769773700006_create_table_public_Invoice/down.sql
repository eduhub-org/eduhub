-- Drop Invoice table and indexes
DROP INDEX IF EXISTS "public"."Invoice_invoiceDate_idx";
DROP INDEX IF EXISTS "public"."Invoice_status_idx";
DROP INDEX IF EXISTS "public"."Invoice_courseEnrollmentId_idx";
DROP INDEX IF EXISTS "public"."Invoice_userId_idx";
DROP INDEX IF EXISTS "public"."Invoice_organizationId_idx";

DROP TABLE IF EXISTS "public"."Invoice";
