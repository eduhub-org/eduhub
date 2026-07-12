-- Backfill Course.courseSeriesId for existing courses
-- Group courses by (title, organizationId) and create a series for each group

-- Insert a CourseSeries for each unique (title, organizationId) combination in existing courses
INSERT INTO "public"."CourseSeries" ("title", "organizationId", "created_at", "updated_at")
SELECT DISTINCT "title", "organizationId", NOW(), NOW()
FROM "public"."Course"
WHERE "courseSeriesId" IS NULL
ON CONFLICT DO NOTHING;

-- Update courses to reference their corresponding series
UPDATE "public"."Course" c
SET "courseSeriesId" = (
  SELECT cs."id"
  FROM "public"."CourseSeries" cs
  WHERE cs."title" = c."title"
  AND (cs."organizationId" IS NULL AND c."organizationId" IS NULL
       OR cs."organizationId" = c."organizationId")
  LIMIT 1
)
WHERE c."courseSeriesId" IS NULL;
