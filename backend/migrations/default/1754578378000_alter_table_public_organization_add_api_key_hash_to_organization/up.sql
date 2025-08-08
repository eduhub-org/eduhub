-- Add apiKeyHash column to Organization table
-- Stores SHA-256 hash of the API key (plain text keys are never stored)
ALTER TABLE "public"."Organization"
ADD COLUMN "apiKeyHash" text NULL;

-- Optional: document the column
COMMENT ON COLUMN "public"."Organization"."apiKeyHash" IS 'SHA-256 hash of the organization API key for participant data access. Plain text keys are never stored.'; 