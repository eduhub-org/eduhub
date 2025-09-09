-- Migrate existing SessionAddress records to use LocationAddress
-- This migration creates LocationAddress records for existing SessionAddress records
-- and updates the SessionAddress to reference the new LocationAddress

-- Step 1: Create LocationAddress entries for existing SessionAddress records
-- We'll create addresses grouped by ("courseLocationId", address) to avoid duplicates

-- First, insert unique addresses into LocationAddress table
INSERT INTO "public"."LocationAddress" (
    "locationOptionId",
    "shortLabel", 
    "address",
    "description"
)
SELECT DISTINCT
    cl."locationOption",
    -- Generate a short label from the first few words or first line of the address
    CASE 
        WHEN LENGTH(sa."address") <= 50 THEN sa."address"
        WHEN POSITION(E'\n' in sa."address") > 0 AND POSITION(E'\n' in sa."address") <= 50 
            THEN LEFT(sa."address", POSITION(E'\n' in sa."address") - 1)
        WHEN POSITION(' ' in SUBSTRING(sa."address" FROM 45)) > 0 
            THEN LEFT(sa."address", 44 + POSITION(' ' in SUBSTRING(sa."address" FROM 45)))
        ELSE LEFT(sa."address", 50) || '...'
    END,
    sa."address",
    'Migrated from SessionAddress'
FROM "public"."SessionAddress" sa
INNER JOIN "public"."CourseLocation" cl ON sa."courseLocationId" = cl.id
WHERE sa."address" IS NOT NULL 
  AND sa."address" != ''
  AND sa."locationAddressId" IS NULL  -- Only migrate records that haven't been migrated yet
  AND cl."locationOption" IS NOT NULL
ON CONFLICT ("locationOptionId", "shortLabel") DO NOTHING;

-- Step 2: Update SessionAddress records to reference the new LocationAddress entries
UPDATE "public"."SessionAddress" sa
SET "locationAddressId" = la.id
FROM "public"."LocationAddress" la
INNER JOIN "public"."CourseLocation" cl ON la."locationOptionId" = cl."locationOption"
WHERE sa."courseLocationId" = cl.id
  AND sa."address" = la."address"
  AND sa."locationAddressId" IS NULL
  AND sa."address" IS NOT NULL
  AND sa."address" != '';

-- Step 3: For any remaining SessionAddress records without a match, 
-- create a generic LocationAddress entry per locationOption (ensuring only one per locationOption)
INSERT INTO "public"."LocationAddress" (
    "locationOptionId",
    "shortLabel",
    "address", 
    "description"
)
SELECT DISTINCT
    cl."locationOption",
    'Generic Address',
    -- Use the first available defaultSessionAddress for this locationOption
    FIRST_VALUE(COALESCE(cl."defaultSessionAddress", 'Address to be determined')) 
        OVER (PARTITION BY cl."locationOption" ORDER BY cl.id),
    'Generic address created during migration'
FROM "public"."SessionAddress" sa
INNER JOIN "public"."CourseLocation" cl ON sa."courseLocationId" = cl.id
WHERE sa."locationAddressId" IS NULL
  AND cl."locationOption" IS NOT NULL
  -- Only consider locationOptions that don't already have a Generic Address
  AND NOT EXISTS (
    SELECT 1 FROM "public"."LocationAddress" la 
    WHERE la."locationOptionId" = cl."locationOption" 
    AND la."shortLabel" = 'Generic Address'
  )
ON CONFLICT ("locationOptionId", "shortLabel") DO NOTHING;

-- Step 4: Update remaining SessionAddress records to use the generic address
UPDATE "public"."SessionAddress" sa
SET "locationAddressId" = la.id
FROM "public"."LocationAddress" la
INNER JOIN "public"."CourseLocation" cl ON la."locationOptionId" = cl."locationOption"
WHERE sa."courseLocationId" = cl.id
  AND sa."locationAddressId" IS NULL
  AND la."shortLabel" = 'Generic Address';

-- Report migration statistics and verify no duplicate generic addresses
DO $$
DECLARE
    total_session_addresses INTEGER;
    migrated_addresses INTEGER;
    created_location_addresses INTEGER;
    duplicate_generic_addresses INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_session_addresses FROM "public"."SessionAddress";
    SELECT COUNT(*) INTO migrated_addresses FROM "public"."SessionAddress" WHERE "locationAddressId" IS NOT NULL;
    SELECT COUNT(*) INTO created_location_addresses FROM "public"."LocationAddress";
    
    -- Check for duplicate generic addresses (should be 0)
    SELECT COUNT(*) INTO duplicate_generic_addresses FROM (
        SELECT "locationOptionId" 
        FROM "public"."LocationAddress" 
        WHERE "shortLabel" = 'Generic Address'
        GROUP BY "locationOptionId" 
        HAVING COUNT(*) > 1
    ) duplicates;
    
    RAISE NOTICE 'Migration completed:';
    RAISE NOTICE '  Total SessionAddress records: %', total_session_addresses;
    RAISE NOTICE '  Migrated to LocationAddress: %', migrated_addresses;
    RAISE NOTICE '  Total LocationAddress records created: %', created_location_addresses;
    RAISE NOTICE '  Duplicate Generic Address entries: % (should be 0)', duplicate_generic_addresses;
    
    -- Fail the migration if duplicates are found
    IF duplicate_generic_addresses > 0 THEN
        RAISE EXCEPTION 'Migration failed: Found % duplicate Generic Address entries per locationOption', duplicate_generic_addresses;
    END IF;
END $$;
