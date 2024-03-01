-- 1. Create the sequence for generating unique integer IDs
CREATE SEQUENCE "public"."user_integerId_seq"
START WITH 1
INCREMENT BY 1;

-- 2. Add the integerId column to the User table in the public schema
ALTER TABLE "public"."User"
ADD COLUMN "integerId" INTEGER;

-- 3. Populate integerId for existing users in the User table
-- Assuming you want to assign sequential integers starting from 1
WITH numbered_users AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "id") AS row_num
  FROM "public"."User"
)
UPDATE "public"."User"
SET "integerId" = numbered_users.row_num
FROM numbered_users
WHERE "public"."User"."id" = numbered_users."id";

-- 4. Set the default value for the integerId column to automatically use the sequence for new users
ALTER TABLE "public"."User"
ALTER COLUMN "integerId" SET DEFAULT nextval('"public"."user_integerId_seq"'::regclass);

-- Adjust the sequence's start value based on the maximum integerId to avoid conflicts with future inserts
SELECT setval('"public"."user_integerId_seq"', (SELECT MAX("integerId") FROM "public"."User"));
