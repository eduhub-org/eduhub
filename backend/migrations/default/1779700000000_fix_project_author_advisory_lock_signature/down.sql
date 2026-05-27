-- Restore previous (broken) bigint-cast advisory lock calls for rollback parity.

CREATE OR REPLACE FUNCTION public.prevent_last_accepted_leave_while_join_requests_pending()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."participationStatus" IS DISTINCT FROM 'ACCEPTED' THEN
    RETURN OLD;
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext('public.ProjectAuthor.projectId')::bigint,
    OLD."projectId"::bigint
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
  PERFORM pg_advisory_xact_lock(
    hashtext('public.ProjectAuthor.projectId')::bigint,
    OLD."projectId"::bigint
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
