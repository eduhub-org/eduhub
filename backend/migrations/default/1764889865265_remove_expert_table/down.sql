-- Rollback: Recreate Expert table and restore expertId columns
-- Note: Expert descriptions cannot be fully restored as they were not migrated

-- Step 1: Recreate Expert table
CREATE TABLE "public"."Expert" (
  "id" serial PRIMARY KEY,
  "userId" uuid NOT NULL,
  "description" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "Expert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);

-- Step 2: Populate Expert from existing CourseInstructor and SessionSpeaker userIds
INSERT INTO "public"."Expert" ("userId")
SELECT DISTINCT "userId" FROM (
  SELECT "userId" FROM "public"."CourseInstructor"
  UNION
  SELECT "userId" FROM "public"."SessionSpeaker"
) AS all_users;

-- Step 3: Add expertId columns to CourseInstructor and SessionSpeaker
ALTER TABLE "public"."CourseInstructor" ADD COLUMN "expertId" integer;
ALTER TABLE "public"."SessionSpeaker" ADD COLUMN "expertId" integer;

-- Step 4: Populate expertId from Expert table
UPDATE "public"."CourseInstructor" ci
SET "expertId" = e."id"
FROM "public"."Expert" e
WHERE ci."userId" = e."userId";

UPDATE "public"."SessionSpeaker" ss
SET "expertId" = e."id"
FROM "public"."Expert" e
WHERE ss."userId" = e."userId";

-- Step 5: Make expertId NOT NULL
ALTER TABLE "public"."CourseInstructor" ALTER COLUMN "expertId" SET NOT NULL;
ALTER TABLE "public"."SessionSpeaker" ALTER COLUMN "expertId" SET NOT NULL;

-- Step 6: Add foreign key constraints to Expert table
ALTER TABLE "public"."CourseInstructor"
  ADD CONSTRAINT "CourseInstructor_expertId_fkey"
  FOREIGN KEY ("expertId")
  REFERENCES "public"."Expert" ("id")
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."SessionSpeaker"
  ADD CONSTRAINT "SessionSpeaker_expertId_fkey"
  FOREIGN KEY ("expertId")
  REFERENCES "public"."Expert" ("id")
  ON UPDATE CASCADE ON DELETE CASCADE;

-- Step 7: Drop userId foreign key constraints
ALTER TABLE "public"."CourseInstructor" DROP CONSTRAINT "CourseInstructor_userId_fkey";
ALTER TABLE "public"."SessionSpeaker" DROP CONSTRAINT "SessionSpeaker_userId_fkey";

-- Step 8: Drop userId columns
ALTER TABLE "public"."CourseInstructor" DROP COLUMN "userId";
ALTER TABLE "public"."SessionSpeaker" DROP COLUMN "userId";

