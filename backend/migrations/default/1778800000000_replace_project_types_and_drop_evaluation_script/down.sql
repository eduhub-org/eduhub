-- Restore the original ProjectType catalog and the evaluation-script columns
-- on Project and ProjectType. References that were set in the new catalog are
-- cleared because their target rows no longer exist after the downgrade.

ALTER TABLE "public"."Project"
  ADD COLUMN IF NOT EXISTS "evaluationScriptUrl" text;

ALTER TABLE "public"."ProjectType"
  ADD COLUMN IF NOT EXISTS "requiresEvaluationScript" boolean NOT NULL DEFAULT false;

UPDATE "public"."Project"
SET "type" = NULL
WHERE "type" IN ('MINIMAL_PROJECT', 'PROJECT_WITH_LINK', 'PROJECT_WITH_PRESENTATION', 'PROJECT_WITH_LINK_AND_PRESENTATION');

UPDATE "public"."Program"
SET "defaultProjectType" = NULL
WHERE "defaultProjectType" IN ('MINIMAL_PROJECT', 'PROJECT_WITH_LINK', 'PROJECT_WITH_PRESENTATION', 'PROJECT_WITH_LINK_AND_PRESENTATION');

DELETE FROM "public"."ProjectType"
WHERE "value" IN ('MINIMAL_PROJECT', 'PROJECT_WITH_LINK', 'PROJECT_WITH_PRESENTATION', 'PROJECT_WITH_LINK_AND_PRESENTATION');

INSERT INTO "public"."ProjectType"
  ("value", "comment", "requiresDocumentation", "requiresPresentation", "requiresExternalUrl", "requiresCoverImage", "requiresEvaluationScript")
VALUES
  ('DOCUMENTATION',                  'Standard documented project; only a documentation upload is required.',                                                            true, false, false, false, false),
  ('DOCUMENTATION_AND_PRESENTATION', 'Documented project that also requires a presentation upload.',                                                                     true, true,  false, false, false),
  ('PROJECT',                        'Praxis-style project requiring documentation, presentation, and a cover image for showcase.',                                      true, true,  false, true,  false),
  ('OPEN_PROJECT',                   'Open / community project that publishes a public site or repository in addition to documentation, presentation, and cover image.', true, true,  true,  true,  false);
