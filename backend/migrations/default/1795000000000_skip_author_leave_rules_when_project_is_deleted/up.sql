-- The project-leave rules on ProjectAuthor (last accepted author can't leave
-- while join requests are open; an empty project is cleaned up) also fired
-- when a whole project was deleted, because the delete cascades to its
-- authors. Deleting a project with an open join request then failed with
-- last_accepted_cannot_leave_while_join_requests_pending. Both rules now skip
-- authors whose project is already gone.

CREATE OR REPLACE FUNCTION public.prevent_last_accepted_leave_while_join_requests_pending()
RETURNS TRIGGER AS $$
BEGIN
  -- Deleting the project removes its authors too. By then the project row is
  -- gone, and this is not anyone leaving the team, so the leave rules don't apply.
  IF NOT EXISTS (SELECT 1 FROM "Project" WHERE id = OLD."projectId") THEN
    RETURN OLD;
  END IF;

  IF OLD."participationStatus" IS DISTINCT FROM 'ACCEPTED' THEN
    RETURN OLD;
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext('public.ProjectAuthor.projectId'),
    OLD."projectId"
  );

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

CREATE OR REPLACE FUNCTION public.delete_project_when_no_project_authors_remain()
RETURNS TRIGGER AS $$
BEGIN
  -- Deleting the project removes its authors too. By then the project row is
  -- gone, and this is not anyone leaving the team, so the leave rules don't apply.
  IF NOT EXISTS (SELECT 1 FROM "Project" WHERE id = OLD."projectId") THEN
    RETURN OLD;
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext('public.ProjectAuthor.projectId'),
    OLD."projectId"
  );

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
