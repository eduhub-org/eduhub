-- Keep Course.courseSeriesId meaningful after the one-off backfill
-- (1780600000006): a series exists only for a course that actually recurs.
-- When a course is published it joins the series of an earlier run with the
-- same title in the same organization; if that earlier run has no series yet,
-- a series is created for both. A course without an earlier run keeps no series
-- (it has no past projects to show). Admins/org admins group runs with differing
-- titles by hand in Manage Courses; copied courses carry their source's series.

-- Titles the admin UI gives a freshly added course ("default_title" in the
-- locales). A course still titled like this is never matched, otherwise such
-- courses would all land in one "Untitled Course" series.
CREATE OR REPLACE FUNCTION "public"."course_title_is_placeholder"(title text)
RETURNS boolean AS $$
  SELECT title IS NULL
    OR lower(trim(title)) IN (
      '',
      'unbenannter kurs', 'unbenanntes event', 'unbenanntes degree',
      'untitled course', 'untitled event', 'untitled degree'
    );
$$ LANGUAGE sql IMMUTABLE;

-- Returns the series a course with this title joins within the program's
-- organization, or NULL when it has no earlier run. In order of preference:
-- the series of the latest other course with that title (so a manually regrouped
-- series keeps attracting new runs); a series with that title; or, if another
-- course with that title has no series yet, a new series that this function
-- also assigns to that course.
CREATE OR REPLACE FUNCTION "public"."resolve_course_series"(course_id integer, course_title text, program_id integer)
RETURNS integer AS $$
DECLARE
  _org integer;
  _series integer;
  _other_course integer;
BEGIN
  SELECT p."organizationId" INTO _org FROM "public"."Program" p WHERE p."id" = program_id;

  -- Serialize resolution per organization and normalized title, so two courses
  -- published at the same time cannot each create their own series. Under read
  -- committed, the lookups below then see a series the other transaction created.
  PERFORM pg_advisory_xact_lock(hashtext(coalesce(_org::text, '') || ':' || lower(trim(course_title))));

  SELECT c."courseSeriesId" INTO _series
  FROM "public"."Course" c
  JOIN "public"."CourseSeries" cs ON cs."id" = c."courseSeriesId"
  WHERE c."id" <> course_id
    AND lower(trim(c."title")) = lower(trim(course_title))
    AND cs."organizationId" IS NOT DISTINCT FROM _org
  ORDER BY c."id" DESC
  LIMIT 1;

  IF _series IS NULL THEN
    SELECT cs."id" INTO _series
    FROM "public"."CourseSeries" cs
    WHERE lower(trim(cs."title")) = lower(trim(course_title))
      AND cs."organizationId" IS NOT DISTINCT FROM _org
    ORDER BY cs."id" DESC
    LIMIT 1;
  END IF;

  IF _series IS NULL THEN
    SELECT c."id" INTO _other_course
    FROM "public"."Course" c
    JOIN "public"."Program" p ON p."id" = c."programId"
    WHERE c."id" <> course_id
      AND c."courseSeriesId" IS NULL
      AND lower(trim(c."title")) = lower(trim(course_title))
      AND p."organizationId" IS NOT DISTINCT FROM _org
    ORDER BY c."id" DESC
    LIMIT 1;

    IF _other_course IS NOT NULL THEN
      INSERT INTO "public"."CourseSeries" ("title", "organizationId")
      VALUES (trim(course_title), _org)
      RETURNING "id" INTO _series;
      UPDATE "public"."Course" SET "courseSeriesId" = _series WHERE "id" = _other_course;
    END IF;
  END IF;

  RETURN _series;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- A course without a series gets one when it is published (or inserted as
-- published, e.g. through the API). Not on a title
-- change: the title field auto-saves while the admin types, so an intermediate
-- title ("Machine Lea") would pick or create the wrong series. Publishing is a
-- single deliberate step with the final title, and past projects only show on
-- published course pages anyway. A series set or cleared by hand before
-- publishing is kept.
CREATE OR REPLACE FUNCTION "public"."assign_course_series_on_publish"()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."published"
     AND NEW."courseSeriesId" IS NULL
     AND NOT "public"."course_title_is_placeholder"(NEW."title")
     AND (TG_OP = 'INSERT' OR (NOT OLD."published" AND OLD."courseSeriesId" IS NULL)) THEN
    NEW."courseSeriesId" := "public"."resolve_course_series"(NEW."id", NEW."title", NEW."programId");
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "assign_Course_courseSeriesId_on_publish"
BEFORE INSERT OR UPDATE OF "published" ON "public"."Course"
FOR EACH ROW
EXECUTE PROCEDURE "public"."assign_course_series_on_publish"();

-- A course and its series must belong to the same organization (via the
-- course's program). This keeps org admins, who may set courseSeriesId, inside
-- their own organization. Moving a course to another organization's program
-- drops its series instead of failing the move.
CREATE OR REPLACE FUNCTION "public"."check_course_series_organization"()
RETURNS TRIGGER AS $$
DECLARE
  _series_org integer;
  _course_org integer;
BEGIN
  IF NEW."courseSeriesId" IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT cs."organizationId" INTO _series_org FROM "public"."CourseSeries" cs WHERE cs."id" = NEW."courseSeriesId";
  SELECT p."organizationId" INTO _course_org FROM "public"."Program" p WHERE p."id" = NEW."programId";
  IF _series_org IS DISTINCT FROM _course_org THEN
    IF TG_OP = 'UPDATE' AND NEW."courseSeriesId" IS NOT DISTINCT FROM OLD."courseSeriesId" THEN
      NEW."courseSeriesId" := NULL;
    ELSE
      RAISE EXCEPTION 'courseSeriesId % belongs to another organization than course %', NEW."courseSeriesId", NEW."id";
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "check_Course_courseSeriesId_organization"
BEFORE INSERT OR UPDATE OF "courseSeriesId", "programId" ON "public"."Course"
FOR EACH ROW
EXECUTE PROCEDURE "public"."check_course_series_organization"();

-- Bring existing data in line: drop the single-course series (most of them
-- come from the first backfill, which gave every title a series), then group
-- the courses without a series that share a title. updated_at is left alone so
-- the admin course list keeps its order.
ALTER TABLE "public"."Course" DISABLE TRIGGER "set_public_Course_updated_at";

UPDATE "public"."Course" c
SET "courseSeriesId" = NULL
WHERE c."courseSeriesId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "public"."Course" other
    WHERE other."courseSeriesId" = c."courseSeriesId" AND other."id" <> c."id"
  );

DELETE FROM "public"."CourseSeries" cs
WHERE NOT EXISTS (SELECT 1 FROM "public"."Course" c WHERE c."courseSeriesId" = cs."id");

-- Row by row, so a series created for one pair is seen by the next course.
DO $$
DECLARE
  _course record;
BEGIN
  FOR _course IN
    SELECT c."id" FROM "public"."Course" c
    WHERE c."courseSeriesId" IS NULL
      AND NOT "public"."course_title_is_placeholder"(c."title")
    ORDER BY c."id"
  LOOP
    UPDATE "public"."Course" c
    SET "courseSeriesId" = "public"."resolve_course_series"(c."id", c."title", c."programId")
    WHERE c."id" = _course."id" AND c."courseSeriesId" IS NULL;
  END LOOP;
END;
$$;

ALTER TABLE "public"."Course" ENABLE TRIGGER "set_public_Course_updated_at";
