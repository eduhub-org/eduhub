-- Remove address fields from User
ALTER TABLE "public"."User"
DROP COLUMN IF EXISTS "addressLine1",
DROP COLUMN IF EXISTS "addressLine2",
DROP COLUMN IF EXISTS "city";
