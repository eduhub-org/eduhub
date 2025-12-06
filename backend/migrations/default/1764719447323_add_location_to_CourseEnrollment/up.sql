-- Add location column to CourseEnrollment table
-- This column stores the LocationOption value for each enrollment
-- NULL means use fallback priority: ONLINE -> KIEL -> HEIDE

ALTER TABLE "public"."CourseEnrollment" 
ADD COLUMN "location" text;

-- Add foreign key constraint to LocationOption table
ALTER TABLE "public"."CourseEnrollment"
ADD CONSTRAINT "CourseEnrollment_location_fkey" 
FOREIGN KEY ("location") 
REFERENCES "public"."LocationOption"("value") 
ON UPDATE restrict 
ON DELETE restrict;

-- Add comment explaining the column
COMMENT ON COLUMN "public"."CourseEnrollment"."location" IS 
E'Location option for this enrollment. NULL means use fallback priority: ONLINE -> KIEL -> HEIDE';

