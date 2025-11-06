-- Add locationAddressId column to SessionAddress table
ALTER TABLE "public"."SessionAddress" 
ADD COLUMN "locationAddressId" integer;

-- Add foreign key constraint to LocationAddress
-- Note: We make this nullable initially to allow gradual migration
ALTER TABLE "public"."SessionAddress"
ADD CONSTRAINT "SessionAddress_locationAddressId_fkey"
FOREIGN KEY ("locationAddressId") REFERENCES "public"."LocationAddress"("id")
ON UPDATE RESTRICT ON DELETE SET NULL;

-- Add comment to explain the new column
COMMENT ON COLUMN "public"."SessionAddress"."locationAddressId" IS E'Foreign key to LocationAddress. Replaces the free-text address field with a structured address reference. Nullable during migration period.';
