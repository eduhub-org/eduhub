-- Hasura allows only one update_permissions entry per role; title locking for template-derived
-- projects ("Neue Gruppe bilden") is enforced here instead of splitting user_access updates.

CREATE OR REPLACE FUNCTION public.enforce_locked_title_for_derived_projects()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."parentProjectId" IS NOT NULL AND NEW.title IS DISTINCT FROM OLD.title THEN
    RAISE EXCEPTION 'Project title cannot be changed for copies created from a course template'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "enforce_locked_title_for_derived_projects_trigger" ON public."Project";

CREATE TRIGGER "enforce_locked_title_for_derived_projects_trigger"
BEFORE UPDATE OF title ON public."Project"
FOR EACH ROW
EXECUTE PROCEDURE public.enforce_locked_title_for_derived_projects();

COMMENT ON FUNCTION public.enforce_locked_title_for_derived_projects()
  IS 'Rows with parentProjectId set are copies from a template; keep title identical to UI/Hasura semantics.';
