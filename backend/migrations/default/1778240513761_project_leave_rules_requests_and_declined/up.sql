-- Block the last ACCEPTED author from leaving while REQUESTED rows exist (join requests must be handled first).
-- When the last ACCEPTED leaves and only DECLINED (or no) author rows remain, delete PROPOSED/ONGOING projects;
-- CASCADE removes remaining ProjectAuthor rows including DECLINED.

CREATE OR REPLACE FUNCTION public.prevent_last_accepted_leave_while_join_requests_pending()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."participationStatus" IS DISTINCT FROM 'ACCEPTED' THEN
    RETURN OLD;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "ProjectAuthor"
    WHERE "projectId" = OLD."projectId"
      AND "participationStatus" = 'ACCEPTED'
      AND id IS DISTINCT FROM OLD.id
  ) THEN
    RETURN OLD;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "ProjectAuthor"
    WHERE "projectId" = OLD."projectId"
      AND "participationStatus" = 'REQUESTED'
  ) THEN
    RAISE EXCEPTION
      'last_accepted_cannot_leave_while_join_requests_pending'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "project_author_before_delete_block_last_with_requests" ON public."ProjectAuthor";

CREATE TRIGGER "project_author_before_delete_block_last_with_requests"
BEFORE DELETE ON public."ProjectAuthor"
FOR EACH ROW
EXECUTE PROCEDURE public.prevent_last_accepted_leave_while_join_requests_pending();

COMMENT ON FUNCTION public.prevent_last_accepted_leave_while_join_requests_pending()
  IS 'Rejects DELETE of the last ACCEPTED ProjectAuthor row while any REQUESTED row exists for the same project.';

DROP TRIGGER IF EXISTS "project_author_after_delete_cleanup_empty_project" ON public."ProjectAuthor";

CREATE OR REPLACE FUNCTION public.delete_project_when_no_project_authors_remain()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "ProjectAuthor"
    WHERE "projectId" = OLD."projectId"
      AND "participationStatus" = 'ACCEPTED'
  ) THEN
    RETURN OLD;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "ProjectAuthor"
    WHERE "projectId" = OLD."projectId"
      AND "participationStatus" = 'REQUESTED'
  ) THEN
    RAISE EXCEPTION
      'project_has_pending_requests_after_delete'
      USING ERRCODE = 'check_violation';
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
  IS 'After ProjectAuthor DELETE: removes the project when no ACCEPTED and no REQUESTED authors remain (DECLINED-only or empty), PROPOSED/ONGOING only; CASCADE drops remaining ProjectAuthor rows.';
