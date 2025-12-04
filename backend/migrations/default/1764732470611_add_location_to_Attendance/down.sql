-- Remove location column from Attendance table

ALTER TABLE "public"."Attendance" 
DROP COLUMN IF EXISTS "location";

