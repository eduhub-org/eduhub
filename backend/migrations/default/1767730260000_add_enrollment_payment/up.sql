-- Add payment tracking columns to CourseEnrollment
ALTER TABLE "public"."CourseEnrollment"
ADD COLUMN "stripeCheckoutSessionId" text,
ADD COLUMN "stripePaymentIntentId" text,
ADD COLUMN "paymentStatus" text DEFAULT 'NONE',
ADD COLUMN "paymentAmount" integer,
ADD COLUMN "paymentCurrency" text;

-- Create PaymentStatus enum table
CREATE TABLE "public"."PaymentStatus" (
  "value" text PRIMARY KEY,
  "comment" text
);

INSERT INTO "public"."PaymentStatus" ("value", "comment") VALUES 
  ('NONE', 'No payment required'),
  ('PENDING', 'Payment initiated but not completed'),
  ('COMPLETED', 'Payment successful'),
  ('FAILED', 'Payment failed'),
  ('REFUNDED', 'Payment was refunded');

COMMENT ON COLUMN "public"."CourseEnrollment"."stripeCheckoutSessionId" IS 'Stripe Checkout Session ID';
COMMENT ON COLUMN "public"."CourseEnrollment"."stripePaymentIntentId" IS 'Stripe Payment Intent ID';
COMMENT ON COLUMN "public"."CourseEnrollment"."paymentStatus" IS 'Current payment status';
COMMENT ON COLUMN "public"."CourseEnrollment"."paymentAmount" IS 'Total payment amount in cents';
COMMENT ON COLUMN "public"."CourseEnrollment"."paymentCurrency" IS 'Payment currency code';

