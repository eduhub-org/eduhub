-- Add foreign key constraint for validatedBy column
-- First drop any existing constraint (may have been created inline in table definition)
ALTER TABLE "public"."CourseAddonMapping"
DROP CONSTRAINT IF EXISTS "CourseAddonMapping_validatedBy_fkey";

ALTER TABLE "public"."CourseAddonMapping"
ADD CONSTRAINT "CourseAddonMapping_validatedBy_fkey"
FOREIGN KEY ("validatedBy")
REFERENCES "public"."User"("id")
ON DELETE SET NULL;

