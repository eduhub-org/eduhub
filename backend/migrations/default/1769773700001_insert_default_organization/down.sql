-- Drop the deletion protection trigger
DROP TRIGGER IF EXISTS protect_default_organization ON "public"."Organization";
DROP FUNCTION IF EXISTS prevent_default_organization_deletion();

-- Delete the default organization
DELETE FROM "public"."Organization" WHERE "id" = 0;
