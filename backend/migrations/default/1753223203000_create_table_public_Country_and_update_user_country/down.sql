-- Remove foreign key constraint from User table
ALTER TABLE "public"."User" DROP CONSTRAINT "User_country_fkey";

-- Drop Country table
DROP TABLE "public"."Country"; 