-- Passed projects (rated as passed: COMPLETED or PUBLISHED, or shown in the
-- public showcase) hold the work an achievement certificate rests on. Nobody
-- may delete them, admins included; this guard covers every role and the
-- Hasura console, not just the management UI.
CREATE OR REPLACE FUNCTION public.prevent_deleting_passed_project()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IN ('COMPLETED', 'PUBLISHED') OR OLD.published THEN
    RAISE EXCEPTION 'passed_project_cannot_be_deleted'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_deleting_passed_project
BEFORE DELETE ON public."Project"
FOR EACH ROW EXECUTE FUNCTION public.prevent_deleting_passed_project();

-- Removing a project from a course deletes only that course's listing; the
-- project itself is deleted once no course lists it any more. This lives in
-- the database because an organizer only sees the listings of their own
-- courses and so cannot tell whether the listing they remove is the last one.
-- Moving a listing to another project (an update of "projectId") takes it away
-- from the old project just the same, so it runs the same check.
-- When the project row itself is being deleted, its listings cascade after
-- it is already gone, so the lookup finds nothing and the check is skipped.
-- The project row is locked first: two removals of different listings of the
-- same project then run one after the other, and the second sees the first.
CREATE OR REPLACE FUNCTION public.delete_project_when_no_course_remains()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW."projectId" = OLD."projectId" THEN
    RETURN NULL;
  END IF;
  PERFORM 1 FROM public."Project" WHERE id = OLD."projectId" FOR UPDATE;
  IF FOUND AND NOT EXISTS (
    SELECT 1 FROM public."ProjectCourse" WHERE "projectId" = OLD."projectId"
  ) THEN
    DELETE FROM public."Project" WHERE id = OLD."projectId";
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER delete_project_when_no_course_remains
AFTER DELETE OR UPDATE OF "projectId" ON public."ProjectCourse"
FOR EACH ROW EXECUTE FUNCTION public.delete_project_when_no_course_remains();

-- Every course a project is listed in, regardless of who may see the
-- ProjectCourse rows: the removal confirmation names the courses that keep
-- the project. The returned courses still pass through Course permissions.
CREATE OR REPLACE FUNCTION public.project_courses(project_row public."Project")
RETURNS SETOF public."Course"
LANGUAGE sql
STABLE
AS $function$
  SELECT c.*
  FROM public."Course" c
  JOIN public."ProjectCourse" pc ON pc."courseId" = c.id
  WHERE pc."projectId" = project_row.id
  ORDER BY c.id
$function$;
