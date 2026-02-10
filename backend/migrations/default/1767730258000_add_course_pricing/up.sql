-- Add pricing columns to Course table
ALTER TABLE "public"."Course" 
ADD COLUMN "basePrice" integer DEFAULT 0,
ADD COLUMN "currency" text DEFAULT 'EUR',
ADD COLUMN "stripeProductId" text,
ADD COLUMN "stripePriceId" text;

COMMENT ON COLUMN "public"."Course"."basePrice" IS 'Base price in cents (e.g., 5000 = €50.00)';
COMMENT ON COLUMN "public"."Course"."currency" IS 'Currency code (EUR, USD, etc.)';
COMMENT ON COLUMN "public"."Course"."stripeProductId" IS 'Stripe Product ID for the base course price';
COMMENT ON COLUMN "public"."Course"."stripePriceId" IS 'Stripe Price ID for the base course price';

