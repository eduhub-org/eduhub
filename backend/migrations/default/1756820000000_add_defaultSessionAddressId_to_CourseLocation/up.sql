-- Add defaultSessionAddressId column to CourseLocation table
-- This field references LocationAddress for default session addresses

ALTER TABLE "public"."CourseLocation" 
ADD COLUMN "defaultSessionAddressId" integer;

-- Add foreign key constraint to ensure referential integrity
ALTER TABLE "public"."CourseLocation"
ADD CONSTRAINT "CourseLocation_defaultSessionAddressId_fkey"
FOREIGN KEY ("defaultSessionAddressId") REFERENCES "public"."LocationAddress"("id")
ON UPDATE RESTRICT ON DELETE SET NULL;

-- Create index to optimize queries on defaultSessionAddressId
CREATE INDEX "idx_course_location_default_session_address_id" 
ON "public"."CourseLocation" ("defaultSessionAddressId");

COMMENT ON COLUMN "public"."CourseLocation"."defaultSessionAddressId" IS 
E'References a LocationAddress that serves as the default for sessions in this course location. Replaces the legacy text-based defaultSessionAddress field.';


