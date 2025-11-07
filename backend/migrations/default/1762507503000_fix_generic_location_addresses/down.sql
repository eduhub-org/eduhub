-- Rollback: This migration cannot be fully rolled back as we don't know
-- which generic addresses were incorrectly created vs. legitimately needed.
-- The generic addresses that were deleted cannot be restored without
-- knowing their original addresses.

-- Note: The SessionAddress.locationAddressId values that were cleared
-- cannot be restored without knowing which generic address they pointed to.
-- This is acceptable as NULL is the correct value for SessionAddress records
-- with NULL/empty addresses to use CourseLocation.defaultSessionAddressId as intended.

DO $$
BEGIN
    RAISE NOTICE 'Rollback: This migration cannot be fully rolled back.';
    RAISE NOTICE 'SessionAddress records with NULL/empty addresses should have locationAddressId = NULL';
    RAISE NOTICE 'to use CourseLocation.defaultSessionAddressId as intended.';
    RAISE NOTICE 'The deleted generic LocationAddress entries cannot be restored without their original data.';
END $$;

