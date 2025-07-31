-- Remove FAQ settings fields from AppSettings table
ALTER TABLE "public"."AppSettings" 
DROP CONSTRAINT IF EXISTS "AppSettings_faqCollectionName_fkey";

ALTER TABLE "public"."AppSettings" 
DROP COLUMN "faqCollectionName";

ALTER TABLE "public"."AppSettings" 
DROP COLUMN "showFaqSection";