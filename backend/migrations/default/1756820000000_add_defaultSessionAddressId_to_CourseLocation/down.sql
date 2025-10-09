-- Rollback: Remove defaultSessionAddressId column from CourseLocation table

ALTER TABLE "public"."CourseLocation" 
DROP COLUMN IF EXISTS "defaultSessionAddressId";


