ALTER TABLE "public"."Organization" 
ADD COLUMN "logo" text;

COMMENT ON COLUMN "public"."Organization"."logo" IS E'Path to the organization logo image file'; 