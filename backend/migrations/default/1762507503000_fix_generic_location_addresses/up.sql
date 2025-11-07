-- Fix incorrectly created generic LocationAddress entries
-- This migration corrects the issue where generic addresses were created for
-- SessionAddress records that should remain NULL to use default addresses

DO $$
DECLARE
    affected_session_addresses INTEGER;
    generic_addresses_to_remove INTEGER;
    generic_addresses_kept INTEGER;
BEGIN
    -- Step 1: Clear locationAddressId from SessionAddress records that have NULL/empty addresses
    -- These should use CourseLocation.defaultSessionAddressId instead
    UPDATE "public"."SessionAddress" sa
    SET "locationAddressId" = NULL
    WHERE sa."locationAddressId" IS NOT NULL
      AND (sa."address" IS NULL OR sa."address" = '')
      AND EXISTS (
          SELECT 1 FROM "public"."LocationAddress" la
          WHERE la.id = sa."locationAddressId"
          AND la."shortLabel" = 'Generic Address'
          AND la."description" = 'Generic address created during migration'
      );
    
    GET DIAGNOSTICS affected_session_addresses = ROW_COUNT;
    
    -- Step 2: Count generic addresses that are no longer referenced
    SELECT COUNT(*) INTO generic_addresses_to_remove
    FROM "public"."LocationAddress" la
    WHERE la."shortLabel" = 'Generic Address'
      AND la."description" = 'Generic address created during migration'
      AND NOT EXISTS (
          SELECT 1 FROM "public"."SessionAddress" sa
          WHERE sa."locationAddressId" = la.id
      );
    
    -- Step 3: Count remaining generic addresses (those that are still referenced by addresses with content)
    SELECT COUNT(*) INTO generic_addresses_kept
    FROM "public"."LocationAddress" la
    WHERE la."shortLabel" = 'Generic Address'
      AND la."description" = 'Generic address created during migration'
      AND EXISTS (
          SELECT 1 FROM "public"."SessionAddress" sa
          WHERE sa."locationAddressId" = la.id
          AND sa."address" IS NOT NULL
          AND sa."address" != ''
      );
    
    -- Step 4: Remove generic addresses that are no longer referenced
    -- These were incorrectly created for SessionAddress records with NULL/empty addresses
    DELETE FROM "public"."LocationAddress" la
    WHERE la."shortLabel" = 'Generic Address'
      AND la."description" = 'Generic address created during migration'
      AND NOT EXISTS (
          SELECT 1 FROM "public"."SessionAddress" sa
          WHERE sa."locationAddressId" = la.id
      );
    
    RAISE NOTICE 'Fix migration completed:';
    RAISE NOTICE '  SessionAddress records cleared (NULL/empty addresses): %', affected_session_addresses;
    RAISE NOTICE '  Generic addresses removed (no longer referenced): %', generic_addresses_to_remove;
    RAISE NOTICE '  Generic addresses kept (still referenced by addresses with content): %', generic_addresses_kept;
    
    -- Verify: Check if any SessionAddress with NULL/empty address still has locationAddressId
    IF EXISTS (
        SELECT 1 FROM "public"."SessionAddress" sa
        WHERE sa."locationAddressId" IS NOT NULL
          AND (sa."address" IS NULL OR sa."address" = '')
    ) THEN
        RAISE WARNING 'Warning: Some SessionAddress records with NULL/empty addresses still have locationAddressId set';
    END IF;
END $$;

