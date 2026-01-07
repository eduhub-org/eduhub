-- Add foreign key constraint for validatedBy column
ALTER TABLE "public"."CourseAddonMapping"
ADD CONSTRAINT "CourseAddonMapping_validatedBy_fkey"
FOREIGN KEY ("validatedBy")
REFERENCES "public"."User"("id")
ON DELETE SET NULL;

