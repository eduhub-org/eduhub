-- Add location column to Attendance table
-- This column stores raw location values that will be mapped to LocationOption values later
-- For LimeSurvey: raw Place values (e.g., "Starterkitchen", "Legienstraße 40", etc.)
-- For Zoom: "ZOOM"
-- No foreign key constraint since these are raw values that need mapping

ALTER TABLE "public"."Attendance" 
ADD COLUMN "location" text;

-- Add comment explaining the column
COMMENT ON COLUMN "public"."Attendance"."location" IS 
E'Location for this attendance. For LimeSurvey attendances, this stores the raw Place value from the QR code (e.g., "Starterkitchen", "Legienstraße 40", "Waterkant", "Kosmos", "KIEL", "HEIDE"). For Zoom attendances, this stores "ZOOM". These values are mapped to LocationOption values (KIEL, HEIDE, ONLINE) when updating CourseEnrollment.location. NULL means location is not yet determined.';

