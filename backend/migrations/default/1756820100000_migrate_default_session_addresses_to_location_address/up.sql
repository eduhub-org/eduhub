-- Migrate default session addresses from CourseLocation to LocationAddress
-- This migration creates LocationAddress records for defaultSessionAddress values
-- and updates CourseLocation to reference the new LocationAddress records

-- Step 1: Insert unique default session addresses into LocationAddress table
-- Only create entries for non-empty defaultSessionAddress values
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
        WHEN LENGTH(cl."defaultSessionAddress") <= 50 THEN cl."defaultSessionAddress"
        WHEN POSITION(E'\n' in cl."defaultSessionAddress") > 0 AND POSITION(E'\n' in cl."defaultSessionAddress") <= 50 
            THEN LEFT(cl."defaultSessionAddress", POSITION(E'\n' in cl."defaultSessionAddress") - 1)
        WHEN POSITION(' ' in SUBSTRING(cl."defaultSessionAddress" FROM 45)) > 0 
            THEN LEFT(cl."defaultSessionAddress", 44 + POSITION(' ' in SUBSTRING(cl."defaultSessionAddress" FROM 45)))
        ELSE LEFT(cl."defaultSessionAddress", 50) || '...'
    END,
    cl."defaultSessionAddress",
    'Migrated from CourseLocation.defaultSessionAddress'
FROM "public"."CourseLocation" cl
WHERE cl."defaultSessionAddress" IS NOT NULL 
  AND cl."defaultSessionAddress" != ''
  AND cl."locationOption" IS NOT NULL
  -- Avoid creating duplicates if the exact same address already exists
  AND NOT EXISTS (
    SELECT 1 FROM "public"."LocationAddress" la
    WHERE la."locationOptionId" = cl."locationOption"
      AND la."address" = cl."defaultSessionAddress"
  )
ON CONFLICT ("locationOptionId", "shortLabel") DO NOTHING;

-- Step 2: Update CourseLocation records to reference the new LocationAddress entries
UPDATE "public"."CourseLocation" cl
SET "defaultSessionAddressId" = la.id
FROM "public"."LocationAddress" la
WHERE cl."locationOption" = la."locationOptionId"
  AND cl."defaultSessionAddress" = la."address"
  AND cl."defaultSessionAddress" IS NOT NULL
  AND cl."defaultSessionAddress" != '';

-- Report migration statistics
DO $$
DECLARE
    total_course_locations INTEGER;
    migrated_defaults INTEGER;
    created_default_addresses INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_course_locations 
    FROM "public"."CourseLocation" 
    WHERE "defaultSessionAddress" IS NOT NULL AND "defaultSessionAddress" != '';
    
    SELECT COUNT(*) INTO migrated_defaults 
    FROM "public"."CourseLocation" 
    WHERE "defaultSessionAddressId" IS NOT NULL;
    
    SELECT COUNT(*) INTO created_default_addresses 
    FROM "public"."LocationAddress" 
    WHERE "description" = 'Migrated from CourseLocation.defaultSessionAddress';
    
    RAISE NOTICE 'Default session address migration completed:';
    RAISE NOTICE '  CourseLocations with defaultSessionAddress: %', total_course_locations;
    RAISE NOTICE '  Migrated to defaultSessionAddressId: %', migrated_defaults;
    RAISE NOTICE '  LocationAddress records created: %', created_default_addresses;
END $$;


