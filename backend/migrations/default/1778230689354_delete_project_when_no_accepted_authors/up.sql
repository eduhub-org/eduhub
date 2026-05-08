-- When the last implementing author is removed from a draft or active project, remove the
-- project row so template copies and self-proposed projects do not linger with no authors.

CREATE OR REPLACE FUNCTION public.delete_project_when_no_accepted_authors_remain()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "ProjectAuthor"
    WHERE "projectId" = OLD."projectId"
      AND participationStatus = 'ACCEPTED'
  ) THEN
    RETURN OLD;
  END IF;

  DELETE FROM "Project" AS p
  WHERE p.id = OLD."projectId"
    AND p.status IN ('PROPOSED', 'ONGOING');

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "project_author_after_delete_cleanup_empty_project" ON public."ProjectAuthor";

CREATE TRIGGER "project_author_after_delete_cleanup_empty_project"
AFTER DELETE ON public."ProjectAuthor"
FOR EACH ROW
EXECUTE PROCEDURE public.delete_project_when_no_accepted_authors_remain();

COMMENT ON FUNCTION public.delete_project_when_no_accepted_authors_remain()
  IS 'Deletes the project when its last ACCEPTED implementing author row is deleted, only while status is PROPOSED or ONGOING';
