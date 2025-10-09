-- Add defaultSessionAddressId column to CourseLocation table
-- This field references LocationAddress for default session addresses

ALTER TABLE "public"."CourseLocation" 
ADD COLUMN "defaultSessionAddressId" integer;

COMMENT ON COLUMN "public"."CourseLocation"."defaultSessionAddressId" IS 
E'References a LocationAddress that serves as the default for sessions in this course location. Replaces the legacy text-based defaultSessionAddress field.';


