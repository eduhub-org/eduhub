-- Add sliderGroup column to CourseGroupOption table
ALTER TABLE "public"."CourseGroupOption" 
ADD COLUMN "sliderGroup" boolean DEFAULT true;

-- Add comment explaining the column
COMMENT ON COLUMN "public"."CourseGroupOption"."sliderGroup" IS E'Indicates whether this group option is used in UI sliders (true) or as metadata tags (false)';

-- Update existing records to set sliderGroup appropriately
-- tech_coding, business_startup, degree, event are used in UI sliders
UPDATE "public"."CourseGroupOption" 
SET "sliderGroup" = true 
WHERE "title" IN ('creative_social_sustainable', 'tech_coding', 'business_startup', 'degree', 'event'); 