-- Create CourseAddonMapping table for validated add-on prices
CREATE TABLE "public"."CourseAddonMapping" (
  "id" serial PRIMARY KEY,
  "courseId" integer NOT NULL REFERENCES "public"."Course"("id") ON DELETE CASCADE,
  "questionId" text NOT NULL,
  "questionTextDe" text,
  "questionTextEn" text,
  "extractedPrice" integer NOT NULL,
  "validatedPrice" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'EUR',
  "description" text NOT NULL,
  "stripeProductId" text,
  "stripePriceId" text,
  "confidence" text DEFAULT 'high',
  "validatedAt" timestamptz,
  "validatedBy" uuid REFERENCES "public"."User"("id") ON DELETE SET NULL,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now(),
  UNIQUE ("courseId", "questionId")
);

COMMENT ON TABLE "public"."CourseAddonMapping" IS 'Stores validated add-on price mappings from Formbricks surveys';
COMMENT ON COLUMN "public"."CourseAddonMapping"."extractedPrice" IS 'Price extracted from question text (in cents)';
COMMENT ON COLUMN "public"."CourseAddonMapping"."validatedPrice" IS 'Admin-validated price (in cents), can override extracted price';
COMMENT ON COLUMN "public"."CourseAddonMapping"."confidence" IS 'Confidence level: high, medium, or low';
COMMENT ON COLUMN "public"."CourseAddonMapping"."stripeProductId" IS 'Stripe Product ID for this add-on';
COMMENT ON COLUMN "public"."CourseAddonMapping"."stripePriceId" IS 'Stripe Price ID for this add-on';

