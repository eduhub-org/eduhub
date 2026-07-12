DROP INDEX IF EXISTS "public"."Course_courseSeriesId_idx";
ALTER TABLE "public"."Course" DROP CONSTRAINT IF EXISTS "Course_courseSeriesId_fkey";
ALTER TABLE "public"."Course" DROP COLUMN IF EXISTS "courseSeriesId";
