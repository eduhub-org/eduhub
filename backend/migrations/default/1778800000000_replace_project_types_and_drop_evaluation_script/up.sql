-- Replace the ProjectType catalog with the new naming scheme and drop the
-- unused evaluation-script columns from both Project and ProjectType.
--
-- New catalog (all rows require documentation):
--   ONLINE_COURSE                          doc
--   CLASSIC_PROJECT                        doc
--   PROJECT_WITH_LINK                      doc + coverImage + externalUrl
--   PROJECT_WITH_PRESENTATION              doc + coverImage + presentation
--   PROJECT_WITH_LINK_AND_PRESENTATION     doc + coverImage + presentation + externalUrl

-- Detach any referencing rows from values that are being removed. The Project.type
-- and Program.defaultProjectType foreign keys use ON UPDATE/DELETE RESTRICT, so
-- existing references would block the DELETE below. In practice no Project rows
-- have a type set yet, but we keep this defensive for safety.
UPDATE "public"."Project"
SET "type" = NULL
WHERE "type" IN ('DOCUMENTATION', 'DOCUMENTATION_AND_PRESENTATION', 'PROJECT', 'OPEN_PROJECT');

UPDATE "public"."Program"
SET "defaultProjectType" = NULL
WHERE "defaultProjectType" IN ('DOCUMENTATION', 'DOCUMENTATION_AND_PRESENTATION', 'PROJECT', 'OPEN_PROJECT');

DELETE FROM "public"."ProjectType"
WHERE "value" IN ('DOCUMENTATION', 'DOCUMENTATION_AND_PRESENTATION', 'PROJECT', 'OPEN_PROJECT');

INSERT INTO "public"."ProjectType"
  ("value", "comment", "requiresDocumentation", "requiresPresentation", "requiresExternalUrl", "requiresCoverImage", "requiresEvaluationScript")
VALUES
  ('CLASSIC_PROJECT',                    'Classic project: only a documentation upload is required.',                                              true, false, false, false, false),
  ('PROJECT_WITH_LINK',                  'Publishable project: requires documentation, cover image, and an external link (e.g. repository).',     true, false, true,  true,  false),
  ('PROJECT_WITH_PRESENTATION',          'Publishable project: requires documentation, cover image, and a presentation upload.',                  true, true,  false, true,  false),
  ('PROJECT_WITH_LINK_AND_PRESENTATION', 'Publishable project: requires documentation, cover image, presentation upload, and an external link.', true, true,  true,  true,  false);

ALTER TABLE "public"."ProjectType"
  DROP COLUMN IF EXISTS "requiresEvaluationScript";

ALTER TABLE "public"."Project"
  DROP COLUMN IF EXISTS "evaluationScriptUrl";
