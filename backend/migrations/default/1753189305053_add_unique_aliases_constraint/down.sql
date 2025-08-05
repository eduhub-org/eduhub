-- Down migration: Remove unique aliases constraint
-- This migration removes the trigger and function that enforce unique aliases

-- Step 1: Drop the trigger
DROP TRIGGER IF EXISTS validate_aliases_unique ON "Organization";

-- Step 2: Drop the validation function  
DROP FUNCTION IF EXISTS validate_unique_aliases();

-- Log completion
SELECT 'Unique aliases constraint removed from Organization table' as result; 