-- Rollback: Restore deprecated columns and enum value

-- Restore DOCUMENTATION_AND_CSV enum value
INSERT INTO "public"."AchievementRecordType"("value", "comment") 
VALUES (E'DOCUMENTATION_AND_CSV', E'A documentation file and a csv data file is uploaded for the achievement record')
ON CONFLICT DO NOTHING;

-- Restore csvTemplateUrl column
ALTER TABLE "public"."AchievementOption" 
ADD COLUMN IF NOT EXISTS "csvTemplateUrl" text;

-- Restore showScoreAuthors column
ALTER TABLE "public"."AchievementOption" 
ADD COLUMN IF NOT EXISTS "showScoreAuthors" boolean DEFAULT false;
