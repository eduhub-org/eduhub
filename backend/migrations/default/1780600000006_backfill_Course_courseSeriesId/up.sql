-- Backfill Course.courseSeriesId for existing courses
-- Group courses by (title, organizationId) and create a series for each group.
-- Course has no organizationId of its own; it is derived from the owning
-- Program (Course.programId -> Program.organizationId).

-- Insert a CourseSeries for each unique (title, organizationId) combination in existing courses
INSERT INTO "public"."CourseSeries" ("title", "organizationId", "created_at", "updated_at")
SELECT DISTINCT c."title", p."organizationId", NOW(), NOW()
FROM "public"."Course" c
LEFT JOIN "public"."Program" p ON p."id" = c."programId"
WHERE c."courseSeriesId" IS NULL
ON CONFLICT DO NOTHING;

-- Update courses to reference their corresponding series
UPDATE "public"."Course" c
SET "courseSeriesId" = (
  SELECT cs."id"
  FROM "public"."CourseSeries" cs
  LEFT JOIN "public"."Program" p ON p."id" = c."programId"
  WHERE cs."title" = c."title"
  AND (cs."organizationId" IS NULL AND p."organizationId" IS NULL
       OR cs."organizationId" = p."organizationId")
  LIMIT 1
)
WHERE c."courseSeriesId" IS NULL;
