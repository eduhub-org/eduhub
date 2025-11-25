-- Change courseId = -1 to NULL for default templates
UPDATE "public"."MailTemplate" SET "courseId" = NULL WHERE "courseId" = -1;

-- Drop the existing unique constraint (it allows multiple NULLs, which we don't want)
ALTER TABLE "public"."MailTemplate" 
  DROP CONSTRAINT IF EXISTS "MailTemplate_type_courseId_key";

-- Add a partial unique index for non-NULL courseIds (one template per type per course)
CREATE UNIQUE INDEX "MailTemplate_type_courseId_unique_not_null" 
  ON "public"."MailTemplate" ("type", "courseId") 
  WHERE "courseId" IS NOT NULL;

-- Add a partial unique index for NULL courseIds (only one default template per type)
CREATE UNIQUE INDEX "MailTemplate_type_unique_null" 
  ON "public"."MailTemplate" ("type") 
  WHERE "courseId" IS NULL;

-- Add foreign key constraint to Course table
ALTER TABLE "public"."MailTemplate" 
  ADD CONSTRAINT "MailTemplate_courseId_fkey" 
  FOREIGN KEY ("courseId") 
  REFERENCES "public"."Course"("id") 
  ON DELETE SET NULL 
  ON UPDATE RESTRICT;

