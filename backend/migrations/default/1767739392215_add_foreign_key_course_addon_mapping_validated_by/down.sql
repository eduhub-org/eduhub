-- Remove foreign key constraint for validatedBy column
ALTER TABLE "public"."CourseAddonMapping"
DROP CONSTRAINT IF EXISTS "CourseAddonMapping_validatedBy_fkey";

