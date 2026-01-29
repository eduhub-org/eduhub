-- Migration: Remove deprecated columns from AchievementOption
-- Remove csvTemplateUrl and showScoreAuthors columns
ALTER TABLE "public"."AchievementOption" DROP COLUMN IF EXISTS "csvTemplateUrl";
ALTER TABLE "public"."AchievementOption" DROP COLUMN IF EXISTS "showScoreAuthors";

-- Remove DOCUMENTATION_AND_CSV from AchievementRecordType enum table
-- First, update any existing records that use this value (if any)
UPDATE "public"."AchievementOption" 
SET "recordType" = 'DOCUMENTATION' 
WHERE "recordType" = 'DOCUMENTATION_AND_CSV';

-- Then delete the enum value
DELETE FROM "public"."AchievementRecordType" WHERE "value" = 'DOCUMENTATION_AND_CSV';
