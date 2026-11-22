-- A published course or event needs at least one instructor (named
-- "organizer" for events): project and approval emails go to them, and the
-- course page names them. Degrees have no instructors and are exempt.
-- Courses published before this rule keep their state; the rule applies when
-- a course is published and when its last instructor is removed.

CREATE OR REPLACE FUNCTION public.course_publish_requires_instructor()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT NEW.published
     OR (TG_OP = 'UPDATE' AND COALESCE(OLD.published, false)) THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM "Program" WHERE id = NEW."programId" AND type = 'DEGREES'
  ) THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM "CourseInstructor" WHERE "courseId" = NEW.id
  ) THEN
    RAISE EXCEPTION 'course_publish_requires_instructor'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER course_publish_requires_instructor
BEFORE INSERT OR UPDATE OF published ON "public"."Course"
FOR EACH ROW EXECUTE PROCEDURE public.course_publish_requires_instructor();

CREATE OR REPLACE FUNCTION public.published_course_keeps_an_instructor()
RETURNS TRIGGER AS $$
BEGIN
  -- Deleting the course or the user account removes the row too. That is not
  -- someone taking the last instructor off a published course.
  IF NOT EXISTS (SELECT 1 FROM "User" WHERE id = OLD."userId") THEN
    RETURN OLD;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM "Course" AS c
    JOIN "Program" AS p ON p.id = c."programId"
    WHERE c.id = OLD."courseId"
      AND c.published
      AND p.type IS DISTINCT FROM 'DEGREES'
  ) THEN
    RETURN OLD;
  END IF;

  -- Serialise concurrent removals so two of them can't both see the other.
  PERFORM 1 FROM "Course" WHERE id = OLD."courseId" FOR UPDATE;

  IF NOT EXISTS (
    SELECT 1
    FROM "CourseInstructor"
    WHERE "courseId" = OLD."courseId"
      AND id IS DISTINCT FROM OLD.id
  ) THEN
    RAISE EXCEPTION 'published_course_requires_instructor'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER published_course_keeps_an_instructor
BEFORE DELETE ON "public"."CourseInstructor"
FOR EACH ROW EXECUTE PROCEDURE public.published_course_keeps_an_instructor();
