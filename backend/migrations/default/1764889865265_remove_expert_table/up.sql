-- Migration: Remove Expert table and replace expertId with userId in CourseInstructor and SessionSpeaker

-- Step 1: Add userId columns to CourseInstructor and SessionSpeaker
ALTER TABLE "public"."CourseInstructor" ADD COLUMN "userId" uuid;
ALTER TABLE "public"."SessionSpeaker" ADD COLUMN "userId" uuid;

-- Step 2: Populate userId from Expert.userId
UPDATE "public"."CourseInstructor" ci
SET "userId" = e."userId"
FROM "public"."Expert" e
WHERE ci."expertId" = e."id";

UPDATE "public"."SessionSpeaker" ss
SET "userId" = e."userId"
FROM "public"."Expert" e
WHERE ss."expertId" = e."id";

-- Step 3: Make userId NOT NULL (after data migration)
ALTER TABLE "public"."CourseInstructor" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "public"."SessionSpeaker" ALTER COLUMN "userId" SET NOT NULL;

-- Step 4: Add foreign key constraints to User table
ALTER TABLE "public"."CourseInstructor"
  ADD CONSTRAINT "CourseInstructor_userId_fkey"
  FOREIGN KEY ("userId")
  REFERENCES "public"."User" ("id")
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."SessionSpeaker"
  ADD CONSTRAINT "SessionSpeaker_userId_fkey"
  FOREIGN KEY ("userId")
  REFERENCES "public"."User" ("id")
  ON UPDATE CASCADE ON DELETE CASCADE;

-- Step 5: Drop expertId foreign key constraints
ALTER TABLE "public"."CourseInstructor" DROP CONSTRAINT "CourseInstructor_expertId_fkey";
ALTER TABLE "public"."SessionSpeaker" DROP CONSTRAINT "SessionSpeaker_expertId_fkey";

-- Step 6: Drop expertId columns
ALTER TABLE "public"."CourseInstructor" DROP COLUMN "expertId";
ALTER TABLE "public"."SessionSpeaker" DROP COLUMN "expertId";

-- Step 7: Drop Expert table
DROP TABLE "public"."Expert";

