-- Block the last ACCEPTED author from leaving while REQUESTED rows exist (join requests must be handled first).
-- When the last ACCEPTED leaves and only DECLINED (or no) author rows remain, delete PROPOSED/ONGOING projects;
-- CASCADE removes remaining ProjectAuthor rows including DECLINED.

CREATE OR REPLACE FUNCTION public.prevent_last_accepted_leave_while_join_requests_pending()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."participationStatus" IS DISTINCT FROM 'ACCEPTED' THEN
    RETURN OLD;
  END IF;

  -- Serialize concurrent ProjectAuthor DELETEs for the same project so the EXISTS
  -- checks and the AFTER-delete cleanup run under a consistent snapshot.
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
  -- Use the same lock key as the BEFORE-delete guard so both run serialized per project.
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

CREATE TRIGGER "project_author_after_delete_cleanup_empty_project"
AFTER DELETE ON public."ProjectAuthor"
FOR EACH ROW
EXECUTE PROCEDURE public.delete_project_when_no_project_authors_remain();

COMMENT ON FUNCTION public.delete_project_when_no_project_authors_remain()
  IS 'After ProjectAuthor DELETE: removes the project when no ACCEPTED and no REQUESTED authors remain (DECLINED-only or empty), PROPOSED/ONGOING only; CASCADE drops remaining ProjectAuthor rows.';

-- One-active-ACCEPTED-project-per-course-per-user.
-- Block any INSERT/UPDATE that would give a user a second ACCEPTED row on a
-- project that shares at least one course with another project where the same
-- user is already ACCEPTED and that other project is still in an active state
-- (PROPOSED / ONGOING / SUBMITTED). Catches both join-acceptance and the
-- nested ACCEPTED row created when a user proposes a new project.
-- Deferred so nested Hasura inserts (Project + ProjectAuthor + ProjectCourse
-- in one mutation) see all rows when the constraint is evaluated at COMMIT.
CREATE OR REPLACE FUNCTION public.enforce_one_active_accepted_project_per_course_per_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."participationStatus" IS DISTINCT FROM 'ACCEPTED' THEN
    RETURN NULL;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD."participationStatus" = 'ACCEPTED' THEN
    RETURN NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "ProjectAuthor" pa
    INNER JOIN "ProjectCourse" pc_self
      ON pc_self."projectId" = NEW."projectId"
    INNER JOIN "ProjectCourse" pc_other
      ON pc_other."projectId" = pa."projectId"
     AND pc_other."courseId" = pc_self."courseId"
    INNER JOIN "Project" p ON p.id = pa."projectId"
    WHERE pa."userId" = NEW."userId"
      AND pa."participationStatus" = 'ACCEPTED'
      AND pa.id IS DISTINCT FROM NEW.id
      AND p."status" IN ('PROPOSED', 'ONGOING', 'SUBMITTED')
  ) THEN
    RAISE EXCEPTION
      'user_already_has_active_accepted_project_in_course'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "project_author_enforce_one_accepted_per_course"
  ON public."ProjectAuthor";

CREATE CONSTRAINT TRIGGER "project_author_enforce_one_accepted_per_course"
AFTER INSERT OR UPDATE OF "participationStatus" ON public."ProjectAuthor"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE PROCEDURE public.enforce_one_active_accepted_project_per_course_per_user();

COMMENT ON FUNCTION public.enforce_one_active_accepted_project_per_course_per_user()
  IS 'Rejects an ACCEPTED ProjectAuthor row when the same user already has an ACCEPTED row on another active (PROPOSED/ONGOING/SUBMITTED) project that shares a course. Deferred so it sees nested inserts at COMMIT.';

-- Auto-decline pending join requests when the same user becomes ACCEPTED.
-- Triggered when an INSERT lands as ACCEPTED (self-propose path) or an UPDATE
-- transitions a row from REQUESTED to ACCEPTED. Declines every other REQUESTED
-- row the user holds on projects that share a course with the new ACCEPTED row.
CREATE OR REPLACE FUNCTION public.decline_pending_requests_on_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."participationStatus" IS DISTINCT FROM 'ACCEPTED' THEN
    RETURN NULL;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD."participationStatus" = 'ACCEPTED' THEN
    RETURN NULL;
  END IF;

  UPDATE "ProjectAuthor" pa
  SET "participationStatus" = 'DECLINED',
      "updated_at" = now()
  FROM "ProjectCourse" pc_self,
       "ProjectCourse" pc_other
  WHERE pc_self."projectId" = NEW."projectId"
    AND pc_other."projectId" = pa."projectId"
    AND pc_other."courseId" = pc_self."courseId"
    AND pa."userId" = NEW."userId"
    AND pa."participationStatus" = 'REQUESTED'
    AND pa.id IS DISTINCT FROM NEW.id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "project_author_decline_pending_on_accepted"
  ON public."ProjectAuthor";

CREATE CONSTRAINT TRIGGER "project_author_decline_pending_on_accepted"
AFTER INSERT OR UPDATE OF "participationStatus" ON public."ProjectAuthor"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE PROCEDURE public.decline_pending_requests_on_accepted();

COMMENT ON FUNCTION public.decline_pending_requests_on_accepted()
  IS 'When a ProjectAuthor row becomes ACCEPTED, set every other REQUESTED row the same user holds on projects that share a course to DECLINED.';
