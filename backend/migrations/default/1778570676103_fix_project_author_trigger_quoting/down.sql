-- Restore the buggy function bodies from 1778240513761_project_leave_rules_requests_and_declined
-- so down-migrating returns the database to the state it had before the fix. The unquoted
-- "participationStatus" causes the same lowercase-fold error any time an ACCEPTED ProjectAuthor
-- row is deleted, which is the broken behavior being reverted to.

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
      AND participationStatus = 'ACCEPTED'
      AND id IS DISTINCT FROM OLD.id
  ) THEN
    RETURN OLD;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "ProjectAuthor"
    WHERE "projectId" = OLD."projectId"
      AND participationStatus = 'REQUESTED'
  ) THEN
    RAISE EXCEPTION
      'last_accepted_cannot_leave_while_join_requests_pending'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.delete_project_when_no_project_authors_remain()
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

  IF EXISTS (
    SELECT 1
    FROM "ProjectAuthor"
    WHERE "projectId" = OLD."projectId"
      AND participationStatus = 'REQUESTED'
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
