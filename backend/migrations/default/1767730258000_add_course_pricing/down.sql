-- Remove pricing columns from Course table
ALTER TABLE "public"."Course" 
DROP COLUMN IF EXISTS "stripePriceId",
DROP COLUMN IF EXISTS "stripeProductId",
DROP COLUMN IF EXISTS "currency",
DROP COLUMN IF EXISTS "basePrice";

