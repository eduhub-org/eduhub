-- Recreate PaymentStatus table
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

-- Re-add payment columns to CourseEnrollment
ALTER TABLE "public"."CourseEnrollment"
ADD COLUMN "stripeCheckoutSessionId" text NULL,
ADD COLUMN "stripePaymentIntentId" text NULL,
ADD COLUMN "paymentStatus" text NULL DEFAULT 'NONE',
ADD COLUMN "paymentAmount" integer NULL,
ADD COLUMN "paymentCurrency" text NULL;

ALTER TABLE "public"."CourseEnrollment"
ADD CONSTRAINT "fk_courseenrollment_paymentstatus"
FOREIGN KEY ("paymentStatus") REFERENCES "public"."PaymentStatus"("value");

COMMENT ON COLUMN "public"."CourseEnrollment"."stripeCheckoutSessionId" IS 'Stripe Checkout Session ID';
COMMENT ON COLUMN "public"."CourseEnrollment"."stripePaymentIntentId" IS 'Stripe Payment Intent ID';
COMMENT ON COLUMN "public"."CourseEnrollment"."paymentStatus" IS 'Current payment status';
COMMENT ON COLUMN "public"."CourseEnrollment"."paymentAmount" IS 'Total payment amount in cents';
COMMENT ON COLUMN "public"."CourseEnrollment"."paymentCurrency" IS 'Payment currency code';
