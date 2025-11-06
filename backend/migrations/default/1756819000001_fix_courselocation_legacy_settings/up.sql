-- Fix CourseLocation legacy settings from CourseAddress
-- This migration cleans up the legacy CourseAddress naming and removes redundant trigger

-- 1. Remove the legacy trigger (since Hasura handles updated_at automatically)
DROP TRIGGER IF EXISTS "set_public_CourseAddress_updated_at" ON "public"."CourseLocation";

-- 2. Fix the sequence synchronization (immediate fix for duplicate key errors)
SELECT pg_catalog.setval('public."CourseAddress_id_seq"', COALESCE((SELECT MAX(id) FROM public."CourseLocation"), 1));

-- 3. Properly rename the primary key constraint for consistency
ALTER TABLE "public"."CourseLocation" RENAME CONSTRAINT "CourseAddress_pkey" TO "CourseLocation_pkey";

-- 4. Create a proper sequence for CourseLocation (optional but recommended)
CREATE SEQUENCE IF NOT EXISTS "public"."CourseLocation_id_seq" OWNED BY "public"."CourseLocation"."id";
SELECT pg_catalog.setval('public."CourseLocation_id_seq"', COALESCE((SELECT MAX(id) FROM public."CourseLocation"), 1));

-- 5. Update the column default to use the new sequence
ALTER TABLE "public"."CourseLocation" ALTER COLUMN "id" SET DEFAULT nextval('public."CourseLocation_id_seq"');
