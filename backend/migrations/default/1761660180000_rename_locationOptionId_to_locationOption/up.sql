-- Rename locationOptionId column to locationOption in LocationAddress table
-- This provides consistent naming with CourseLocation.locationOption

ALTER TABLE "public"."LocationAddress" 
RENAME COLUMN "locationOptionId" TO "locationOption";

-- Update the comment to reflect the new column name
COMMENT ON COLUMN "public"."LocationAddress"."locationOption" IS 
E'Foreign key to LocationOption. Each address must belong to exactly one location option.';

