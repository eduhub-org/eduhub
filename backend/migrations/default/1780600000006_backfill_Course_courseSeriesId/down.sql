-- Revert Course.courseSeriesId backfill
UPDATE "public"."Course"
SET "courseSeriesId" = NULL;

-- Optionally delete CourseSeries entries that were created by the backfill
-- (commented out to preserve series that may have been manually created)
-- DELETE FROM "public"."CourseSeries"
-- WHERE id NOT IN (SELECT DISTINCT "courseSeriesId" FROM "public"."Course" WHERE "courseSeriesId" IS NOT NULL);
