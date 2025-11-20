-- Remove foreign key constraint
ALTER TABLE "public"."MailTemplate" 
  DROP CONSTRAINT IF EXISTS "MailTemplate_courseId_fkey";

-- Drop partial unique indexes
DROP INDEX IF EXISTS "public"."MailTemplate_type_unique_null";
DROP INDEX IF EXISTS "public"."MailTemplate_type_courseId_unique_not_null";

-- Restore original unique constraint
ALTER TABLE "public"."MailTemplate" 
  ADD CONSTRAINT "MailTemplate_type_courseId_key" 
  UNIQUE ("type", "courseId");

-- Change NULL back to -1 for default templates
UPDATE "public"."MailTemplate" SET "courseId" = -1 WHERE "courseId" IS NULL;

