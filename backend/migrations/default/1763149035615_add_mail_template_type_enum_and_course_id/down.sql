-- Remove unique constraint on (type, courseId)
ALTER TABLE "public"."MailTemplate" DROP CONSTRAINT IF EXISTS "MailTemplate_type_courseId_key";

-- Handle duplicates: Keep only one template per type (prefer courseId = -1, otherwise keep the first one)
-- Delete course-specific templates that would create duplicates when renaming type to title
DELETE FROM "public"."MailTemplate" 
WHERE "Id" IN (
  SELECT "Id" 
  FROM (
    SELECT "Id", 
           ROW_NUMBER() OVER (PARTITION BY "type" ORDER BY CASE WHEN "courseId" = -1 THEN 0 ELSE 1 END, "Id") as rn
    FROM "public"."MailTemplate"
  ) ranked
  WHERE rn > 1
);

-- Rename type column back to title
ALTER TABLE "public"."MailTemplate" RENAME COLUMN "type" TO "title";

-- Restore unique constraint on title
ALTER TABLE "public"."MailTemplate" ADD CONSTRAINT "MailTemplate_title_key" UNIQUE ("title");

-- Remove courseId column
ALTER TABLE "public"."MailTemplate" DROP COLUMN IF EXISTS "courseId";

-- Drop MailTemplateType ENUM table
DROP TABLE IF EXISTS "public"."MailTemplateType";

