-- Hotfix: self-propose project creation failed with
-- 'project_submission_deadline_passed' even when the deadline was open.
--
-- Cause: the deadline gate ran as an immediate BEFORE INSERT trigger on
-- ProjectAuthor. During self-propose creation the frontend sends a single
-- nested Hasura insert (Project + ProjectAuthor + ProjectCourse). The
-- ProjectAuthor row is inserted before its sibling ProjectCourse row, so the
-- trigger's "is there a linked course with an open deadline?" lookup found no
-- ProjectCourse row yet and raised the exception.
--
-- Fix: keep the same logic/function but defer the check to transaction commit
-- using a DEFERRABLE INITIALLY DEFERRED constraint trigger. By commit time both
-- the ProjectAuthor and ProjectCourse rows exist in the same transaction, so the
-- linked-course deadline lookup is correct for creation, join requests, and
-- genuine after-deadline attempts alike.

DROP TRIGGER IF EXISTS "project_author_before_insert_reject_join_after_deadline"
  ON public."ProjectAuthor";

DROP TRIGGER IF EXISTS "project_author_after_insert_reject_join_after_deadline"
  ON public."ProjectAuthor";

CREATE CONSTRAINT TRIGGER "project_author_after_insert_reject_join_after_deadline"
AFTER INSERT ON public."ProjectAuthor"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE PROCEDURE public.reject_project_author_join_after_submission_deadline();
