DROP TRIGGER IF EXISTS "project_author_after_delete_cleanup_empty_project" ON public."ProjectAuthor";

DROP FUNCTION IF EXISTS public.delete_project_when_no_accepted_authors_remain();
