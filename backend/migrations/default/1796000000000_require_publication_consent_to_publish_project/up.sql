-- Publishing a project in the public showcase needs its team's publication
-- consent (#2252). A project has consent when its latest ProjectConsentEvent
-- (created_at desc, id desc) is 'granted'. Project Templates (PROPOSED with no
-- ACCEPTED ProjectAuthor) have no team and are always publishable.
--
-- Keep in sync with canPublishProject / isOpenTemplate in
-- frontend-nx/apps/edu-hub/components/pages/CourseContent/Projects/projectStatusDisplay.ts

-- Guard: published may only become true for an open Project Template or with
-- the team's current consent. Runs for every role, the Hasura console and
-- scripts. Only the change to true is checked, so re-saving an already
-- published project (or unpublishing) never fails.
CREATE OR REPLACE FUNCTION public.enforce_project_publication_consent()
RETURNS TRIGGER AS $$
DECLARE
  latest_event text;
BEGIN
  IF NEW.published IS NOT TRUE
     OR (TG_OP = 'UPDATE' AND OLD.published IS TRUE) THEN
    RETURN NEW;
  END IF;

  IF NOT (
    NEW.status = 'PROPOSED'
    AND NOT EXISTS (
      SELECT 1
      FROM public."ProjectAuthor" pa
      WHERE pa."projectId" = NEW.id
        AND pa."participationStatus" = 'ACCEPTED'
    )
  ) THEN
    SELECT e."eventType" INTO latest_event
    FROM public."ProjectConsentEvent" e
    WHERE e."projectId" = NEW.id
    ORDER BY e.created_at DESC, e.id DESC
    LIMIT 1;

    IF latest_event IS DISTINCT FROM 'granted' THEN
      RAISE EXCEPTION 'project_publication_requires_consent: project % can only be published once its team has granted publication consent (Project Templates are exempt)', NEW.id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_project_publication_consent
BEFORE INSERT OR UPDATE OF published ON public."Project"
FOR EACH ROW EXECUTE FUNCTION public.enforce_project_publication_consent();

-- Withdrawing consent takes a published project out of the showcase. Staff see
-- the withdrawal from the team's latest consent event, so nothing is stamped.
CREATE OR REPLACE FUNCTION public.unpublish_project_on_consent_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public."Project"
  SET published = false
  WHERE id = NEW."projectId"
    AND published IS TRUE;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER unpublish_project_on_consent_withdrawal
AFTER INSERT ON public."ProjectConsentEvent"
FOR EACH ROW
WHEN (NEW."eventType" = 'withdrawn')
EXECUTE FUNCTION public.unpublish_project_on_consent_withdrawal();
