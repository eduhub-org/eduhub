-- Remove redundant buyerOrganizationId from Invoice
-- B2B buyer org is derived via Invoice.courseEnrollmentId -> CourseEnrollment.billingOrganizationId
ALTER TABLE "public"."Invoice"
DROP CONSTRAINT IF EXISTS "Invoice_buyerOrganizationId_fkey";

ALTER TABLE "public"."Invoice"
DROP COLUMN IF EXISTS "buyerOrganizationId";
