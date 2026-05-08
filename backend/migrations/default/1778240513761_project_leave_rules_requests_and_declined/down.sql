DROP TRIGGER IF EXISTS "project_author_before_delete_block_last_with_requests" ON public."ProjectAuthor";

DROP FUNCTION IF EXISTS public.prevent_last_accepted_leave_while_join_requests_pending();

DROP TRIGGER IF EXISTS "project_author_after_delete_cleanup_empty_project" ON public."ProjectAuthor";

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
