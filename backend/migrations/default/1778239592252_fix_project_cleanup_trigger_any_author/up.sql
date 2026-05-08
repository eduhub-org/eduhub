-- Leave project failed when another user had a non-ACCEPTED ProjectAuthor row (e.g. REQUESTED).
-- The previous trigger only looked for ACCEPTED rows, so it tried to delete the project while
-- participants still existed, which could break the mutation. Auto-delete the project only when
-- no ProjectAuthor rows remain for that project.

DROP TRIGGER IF EXISTS "project_author_after_delete_cleanup_empty_project" ON public."ProjectAuthor";

DROP FUNCTION IF EXISTS public.delete_project_when_no_accepted_authors_remain();

CREATE OR REPLACE FUNCTION public.delete_project_when_no_project_authors_remain()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "ProjectAuthor"
    WHERE "projectId" = OLD."projectId"
  ) THEN
    RETURN OLD;
  END IF;

  DELETE FROM "Project" AS p
  WHERE p.id = OLD."projectId"
    AND p.status IN ('PROPOSED', 'ONGOING');

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "project_author_after_delete_cleanup_empty_project"
AFTER DELETE ON public."ProjectAuthor"
FOR EACH ROW
EXECUTE PROCEDURE public.delete_project_when_no_project_authors_remain();

COMMENT ON FUNCTION public.delete_project_when_no_project_authors_remain()
  IS 'Deletes the project when its last ProjectAuthor row is deleted, only while status is PROPOSED or ONGOING';
