-- Remove unique constraint on (type, courseId)
ALTER TABLE "public"."MailTemplate" DROP CONSTRAINT IF EXISTS "MailTemplate_type_courseId_key";

-- Rename type column back to title
ALTER TABLE "public"."MailTemplate" RENAME COLUMN "type" TO "title";

-- Restore unique constraint on title
ALTER TABLE "public"."MailTemplate" ADD CONSTRAINT "MailTemplate_title_key" UNIQUE ("title");

-- Remove courseId column
ALTER TABLE "public"."MailTemplate" DROP COLUMN IF EXISTS "courseId";

-- Drop MailTemplateType ENUM table
DROP TABLE IF EXISTS "public"."MailTemplateType";

