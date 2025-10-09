-- Rollback the migration: Clear defaultSessionAddressId from CourseLocation
-- Note: This doesn't delete the LocationAddress records to avoid data loss
-- If you need to completely rollback, you should manually review and clean up LocationAddress table

UPDATE "public"."CourseLocation" 
SET "defaultSessionAddressId" = NULL 
WHERE "defaultSessionAddressId" IS NOT NULL;

-- Optionally, remove LocationAddress records that were created during this migration
-- Uncomment the following lines if you want to remove migrated default addresses
-- WARNING: This will permanently delete the migrated LocationAddress data

-- DELETE FROM "public"."LocationAddress" 
-- WHERE "description" = 'Migrated from CourseLocation.defaultSessionAddress';

RAISE NOTICE 'Migration rollback completed. CourseLocation.defaultSessionAddressId set to NULL.';
RAISE NOTICE 'LocationAddress records were NOT deleted to preserve data integrity.';
RAISE NOTICE 'Review and manually clean up LocationAddress table if needed.';


