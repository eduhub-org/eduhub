DROP TRIGGER IF EXISTS "project_author_before_delete_block_last_with_requests" ON public."ProjectAuthor";

DROP FUNCTION IF EXISTS public.prevent_last_accepted_leave_while_join_requests_pending();

DROP TRIGGER IF EXISTS "project_author_after_delete_cleanup_empty_project" ON public."ProjectAuthor";

DROP FUNCTION IF EXISTS public.delete_project_when_no_project_authors_remain();
