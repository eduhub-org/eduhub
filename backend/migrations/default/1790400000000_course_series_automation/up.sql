-- Keep Course.courseSeriesId filled after the one-off backfill (1780600000006):
-- when a course is published it joins the series of an earlier run with the
-- same title in the same organization, or gets a new series. Admins/org admins
-- correct the grouping by hand in Manage Courses; copied courses carry their
-- source's series.

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

-- Finds the series for a course title within the program's organization, or
-- creates one. Prefers the series of the latest course with that title (so a
-- manually regrouped series keeps attracting new runs), then a series with that
-- title (e.g. one created moments ago for another course of this batch).
CREATE OR REPLACE FUNCTION "public"."resolve_course_series"(course_id integer, course_title text, program_id integer)
RETURNS integer AS $$
DECLARE
  _org integer;
  _series integer;
BEGIN
  SELECT p."organizationId" INTO _org FROM "public"."Program" p WHERE p."id" = program_id;

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
    INSERT INTO "public"."CourseSeries" ("title", "organizationId")
    VALUES (trim(course_title), _org)
    RETURNING "id" INTO _series;
  END IF;

  RETURN _series;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- A course without a series gets one when it is published. Not on a title
-- change: the title field auto-saves while the admin types, so an intermediate
-- title ("Machine Lea") would pick or create the wrong series. Publishing is a
-- single deliberate step with the final title, and past projects only show on
-- published course pages anyway. A series set or cleared by hand before
-- publishing is kept.
CREATE OR REPLACE FUNCTION "public"."assign_course_series_on_publish"()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."published" AND NOT OLD."published"
     AND NEW."courseSeriesId" IS NULL
     AND OLD."courseSeriesId" IS NULL
     AND NOT "public"."course_title_is_placeholder"(NEW."title") THEN
    NEW."courseSeriesId" := "public"."resolve_course_series"(NEW."id", NEW."title", NEW."programId");
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "assign_Course_courseSeriesId_on_publish"
BEFORE UPDATE OF "published" ON "public"."Course"
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

-- Catch up on the courses created since the first backfill. updated_at is left
-- alone so the admin course list (ordered by it) keeps its order.
ALTER TABLE "public"."Course" DISABLE TRIGGER "set_public_Course_updated_at";

UPDATE "public"."Course" c
SET "courseSeriesId" = "public"."resolve_course_series"(c."id", c."title", c."programId")
WHERE c."courseSeriesId" IS NULL
  AND NOT "public"."course_title_is_placeholder"(c."title");

ALTER TABLE "public"."Course" ENABLE TRIGGER "set_public_Course_updated_at";
