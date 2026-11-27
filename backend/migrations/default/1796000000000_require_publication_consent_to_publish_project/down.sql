DROP TRIGGER IF EXISTS unpublish_project_on_team_without_consent ON public."ProjectAuthor";
DROP FUNCTION IF EXISTS public.unpublish_project_on_team_without_consent();
DROP TRIGGER IF EXISTS unpublish_project_on_consent_withdrawal ON public."ProjectConsentEvent";
DROP FUNCTION IF EXISTS public.unpublish_project_on_consent_withdrawal();
DROP TRIGGER IF EXISTS enforce_project_publication_consent ON public."Project";
DROP FUNCTION IF EXISTS public.enforce_project_publication_consent();
