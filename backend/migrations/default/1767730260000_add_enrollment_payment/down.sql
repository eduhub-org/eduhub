-- Remove payment tracking columns from CourseEnrollment
ALTER TABLE "public"."CourseEnrollment"
DROP COLUMN IF EXISTS "paymentCurrency",
DROP COLUMN IF EXISTS "paymentAmount",
DROP COLUMN IF EXISTS "paymentStatus",
DROP COLUMN IF EXISTS "stripePaymentIntentId",
DROP COLUMN IF EXISTS "stripeCheckoutSessionId";

-- Drop PaymentStatus enum table
DROP TABLE IF EXISTS "public"."PaymentStatus";

