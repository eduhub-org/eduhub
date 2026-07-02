-- Revert to the immediate BEFORE INSERT deadline gate.

DROP TRIGGER IF EXISTS "project_author_after_insert_reject_join_after_deadline"
  ON public."ProjectAuthor";

DROP TRIGGER IF EXISTS "project_author_before_insert_reject_join_after_deadline"
  ON public."ProjectAuthor";

CREATE TRIGGER "project_author_before_insert_reject_join_after_deadline"
BEFORE INSERT ON public."ProjectAuthor"
FOR EACH ROW
EXECUTE PROCEDURE public.reject_project_author_join_after_submission_deadline();
