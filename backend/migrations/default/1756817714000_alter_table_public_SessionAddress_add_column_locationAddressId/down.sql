-- Drop the foreign key constraint first
ALTER TABLE "public"."SessionAddress" 
DROP CONSTRAINT IF EXISTS "SessionAddress_locationAddressId_fkey";

-- Drop the locationAddressId column
ALTER TABLE "public"."SessionAddress" 
DROP COLUMN IF EXISTS "locationAddressId";
