-- Remove the apiKeyHash column from Organization table
DROP INDEX IF EXISTS "Organization_apiKeyHash_idx";
ALTER TABLE "public"."Organization" DROP COLUMN IF EXISTS "apiKeyHash"; 