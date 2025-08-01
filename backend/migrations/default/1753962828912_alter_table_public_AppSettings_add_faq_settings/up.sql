-- Add FAQ settings fields to AppSettings table
ALTER TABLE "public"."AppSettings" 
ADD COLUMN "showFaqSection" boolean NOT NULL DEFAULT false;

ALTER TABLE "public"."AppSettings" 
ADD COLUMN "faqCollectionName" text NOT NULL DEFAULT 'default';

-- Add foreign key constraint to FaqCollection
-- Using CASCADE for UPDATE to allow smooth collection renames
-- Using RESTRICT for DELETE to prevent accidental collection deletion
ALTER TABLE "public"."AppSettings"
ADD CONSTRAINT "AppSettings_faqCollectionName_fkey"
FOREIGN KEY ("faqCollectionName") REFERENCES "public"."FaqCollection"("name")
ON UPDATE CASCADE ON DELETE RESTRICT;