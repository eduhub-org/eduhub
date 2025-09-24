-- Drop the trigger and function
DROP TRIGGER IF EXISTS "set_public_LocationAddress_updated_at" ON "public"."LocationAddress";

-- Drop the table (this will also drop the foreign key constraints)
DROP TABLE IF EXISTS "public"."LocationAddress";
