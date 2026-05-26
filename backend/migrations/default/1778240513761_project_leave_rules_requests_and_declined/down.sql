DROP TRIGGER IF EXISTS "project_author_decline_pending_on_accepted" ON public."ProjectAuthor";

DROP FUNCTION IF EXISTS public.decline_pending_requests_on_accepted();

DROP TRIGGER IF EXISTS "project_author_enforce_one_accepted_per_course" ON public."ProjectAuthor";

DROP FUNCTION IF EXISTS public.enforce_one_active_accepted_project_per_course_per_user();

DROP TRIGGER IF EXISTS "project_author_before_delete_block_last_with_requests" ON public."ProjectAuthor";

DROP FUNCTION IF EXISTS public.prevent_last_accepted_leave_while_join_requests_pending();

DROP TRIGGER IF EXISTS "project_author_after_delete_cleanup_empty_project" ON public."ProjectAuthor";

DROP FUNCTION IF EXISTS public.delete_project_when_no_project_authors_remain();
