-- Migration: Add unique aliases constraint
-- This migration cleans up existing duplicate aliases and adds a constraint to prevent future duplicates

-- Step 1: Create a function to identify and resolve duplicate aliases
CREATE OR REPLACE FUNCTION resolve_duplicate_aliases() RETURNS void AS $$
DECLARE
    duplicate_record RECORD;
    keeper_org_id INTEGER;
    alias_to_clean TEXT;
    orgs_with_alias RECORD;
    updated_aliases JSONB;
BEGIN
    -- Log start of cleanup
    RAISE NOTICE 'Starting alias duplicate cleanup...';
    
    -- Find all duplicate aliases across organizations
    FOR duplicate_record IN
        SELECT 
            alias_value,
            array_agg(org_id ORDER BY created_at ASC) as org_ids,
            count(*) as duplicate_count
        FROM (
            SELECT 
                o.id as org_id,
                o.name as org_name,
                o.created_at,
                jsonb_array_elements_text(o.aliases) as alias_value
            FROM "Organization" o 
            WHERE o.aliases IS NOT NULL 
            AND jsonb_array_length(o.aliases) > 0
        ) alias_expanded
        GROUP BY alias_value
        HAVING count(*) > 1
    LOOP
        alias_to_clean := duplicate_record.alias_value;
        keeper_org_id := duplicate_record.org_ids[1]; -- Keep with oldest organization
        
        RAISE NOTICE 'Resolving duplicate alias "%" - keeping with org ID %, removing from % others', 
            alias_to_clean, keeper_org_id, array_length(duplicate_record.org_ids, 1) - 1;
        
        -- Remove the alias from all organizations except the keeper
        FOR orgs_with_alias IN
            SELECT id, name, aliases 
            FROM "Organization" 
            WHERE id = ANY(duplicate_record.org_ids) 
            AND id != keeper_org_id
            AND aliases ? alias_to_clean
        LOOP
            -- Remove the duplicate alias from this organization
            updated_aliases := (
                SELECT jsonb_agg(elem)
                FROM jsonb_array_elements_text(orgs_with_alias.aliases) AS elem
                WHERE elem != alias_to_clean
            );
            
            -- Handle case where removing alias results in empty array
            IF updated_aliases IS NULL THEN
                updated_aliases := '[]'::jsonb;
            END IF;
            
            -- Update the organization
            UPDATE "Organization" 
            SET aliases = CASE 
                WHEN updated_aliases = '[]'::jsonb THEN NULL 
                ELSE updated_aliases 
            END
            WHERE id = orgs_with_alias.id;
            
            RAISE NOTICE 'Removed alias "%" from organization "%" (ID: %)', 
                alias_to_clean, orgs_with_alias.name, orgs_with_alias.id;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Alias duplicate cleanup completed.';
END;
$$ LANGUAGE plpgsql;

-- Step 2: Execute the cleanup
SELECT resolve_duplicate_aliases();

-- Step 3: Create function to validate unique aliases on insert/update
CREATE OR REPLACE FUNCTION validate_unique_aliases() RETURNS TRIGGER AS $$
DECLARE
    alias_value TEXT;
    existing_org_name TEXT;
    existing_org_id INTEGER;
BEGIN
    -- Skip validation if aliases is NULL or empty
    IF NEW.aliases IS NULL OR jsonb_array_length(NEW.aliases) = 0 THEN
        RETURN NEW;
    END IF;
    
    -- Check each alias for uniqueness
    FOR alias_value IN 
        SELECT jsonb_array_elements_text(NEW.aliases)
    LOOP
        -- Check if this alias exists in any other organization
        SELECT o.id, o.name INTO existing_org_id, existing_org_name
        FROM "Organization" o
        WHERE o.id != COALESCE(NEW.id, -1)  -- Exclude current org (handles both INSERT and UPDATE)
        AND o.aliases ? alias_value
        LIMIT 1;
        
        IF FOUND THEN
            RAISE EXCEPTION 'Alias "%" already exists in organization "%" (ID: %). Aliases must be unique across all organizations.', 
                alias_value, existing_org_name, existing_org_id;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to enforce unique aliases
DROP TRIGGER IF EXISTS validate_aliases_unique ON "Organization";
CREATE TRIGGER validate_aliases_unique
    BEFORE INSERT OR UPDATE OF aliases ON "Organization"
    FOR EACH ROW 
    EXECUTE FUNCTION validate_unique_aliases();

-- Step 5: Clean up the temporary function
DROP FUNCTION resolve_duplicate_aliases();

-- Log completion
SELECT 'Unique aliases constraint successfully added to Organization table' as result; 