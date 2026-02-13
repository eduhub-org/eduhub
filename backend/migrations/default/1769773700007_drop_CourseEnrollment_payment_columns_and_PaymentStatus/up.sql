-- Remove redundant payment fields from CourseEnrollment
-- Invoice table now tracks payments via Stripe. Free enrollments have no linked Invoice.
-- No data migration needed: platform has no payments yet.
ALTER TABLE "public"."CourseEnrollment"
DROP CONSTRAINT IF EXISTS "fk_courseenrollment_paymentstatus";

ALTER TABLE "public"."CourseEnrollment"
DROP COLUMN IF EXISTS "stripeCheckoutSessionId",
DROP COLUMN IF EXISTS "stripePaymentIntentId",
DROP COLUMN IF EXISTS "paymentStatus",
DROP COLUMN IF EXISTS "paymentAmount",
DROP COLUMN IF EXISTS "paymentCurrency";

-- Drop PaymentStatus table (no longer referenced)
DROP TABLE IF EXISTS "public"."PaymentStatus";
