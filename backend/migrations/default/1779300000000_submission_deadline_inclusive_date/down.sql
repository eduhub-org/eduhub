DROP TRIGGER IF EXISTS "project_author_before_insert_reject_join_after_deadline"
  ON public."ProjectAuthor";

DROP FUNCTION IF EXISTS public.reject_project_author_join_after_submission_deadline();
