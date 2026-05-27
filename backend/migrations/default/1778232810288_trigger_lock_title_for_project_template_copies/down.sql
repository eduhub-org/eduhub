DROP TRIGGER IF EXISTS "enforce_locked_title_for_derived_projects_trigger" ON public."Project";

DROP FUNCTION IF EXISTS public.enforce_locked_title_for_derived_projects();
