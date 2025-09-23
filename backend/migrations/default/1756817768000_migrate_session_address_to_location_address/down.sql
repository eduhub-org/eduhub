-- Rollback the migration: Clear locationAddressId from SessionAddress
-- Note: This doesn't delete the LocationAddress records to avoid data loss
-- If you need to completely rollback, you should manually review and clean up LocationAddress table

UPDATE "public"."SessionAddress" 
SET "locationAddressId" = NULL 
WHERE "locationAddressId" IS NOT NULL;

-- Optionally, remove LocationAddress records that were created during migration
-- Uncomment the following lines if you want to remove migrated addresses
-- WARNING: This will permanently delete the migrated LocationAddress data

-- DELETE FROM "public"."LocationAddress" 
-- WHERE "description" = 'Migrated from SessionAddress' 
--    OR "description" = 'Generic address created during migration';

RAISE NOTICE 'Migration rollback completed. SessionAddress.locationAddressId set to NULL.';
RAISE NOTICE 'LocationAddress records were NOT deleted to preserve data integrity.';
RAISE NOTICE 'Review and manually clean up LocationAddress table if needed.';
