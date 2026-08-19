-- New classical project type whose only mandatory upload is the documentation.
--
-- The cover image is mandatory for every *classical* project and is applied
-- implicitly by the UI (ProjectFormatSelector shows no cover checkbox;
-- resolveClassicProjectType forces requiresCoverImage = true). Hence
-- requiresCoverImage = true here even though the label reads "nur Dokumentation":
-- "only" refers to the uploads the instructor actively selects, not to the
-- cover image that every classical project carries.
--
-- CLASSIC_PROJECT is deliberately NOT modified. It holds every project migrated
-- from the legacy AchievementRecord model (migration 1780045613786) and must keep
-- requiresCoverImage = false so those projects are not retroactively marked as
-- missing a mandatory deliverable. CLASSIC_PROJECT stays legacy and unselectable.

INSERT INTO "public"."ProjectType"
  ("value", "comment", "requiresDocumentation", "requiresPresentation",
   "requiresExternalUrl", "requiresCoverImage", "certificateTemplateId")
SELECT
  'PROJECT_WITH_DOCUMENTATION_ONLY',
  'Classical project: documentation upload and cover image; no presentation and no external link. The cover image is implicit for every classical project.',
  true, false, false, true,
  (SELECT "certificateTemplateId"
     FROM "public"."ProjectType"
    WHERE "value" = 'PROJECT_WITH_PRESENTATION')
WHERE NOT EXISTS (
  SELECT 1 FROM "public"."ProjectType"
   WHERE "value" = 'PROJECT_WITH_DOCUMENTATION_ONLY'
);

-- Default documentation instruction for the new type.
--
-- Required because Project_ongoing_requires_type_and_instruction_check forbids a
-- NULL documentationInstructionId on any non-PROPOSED project, and the instructor
-- UI fills in the type's default whenever the type changes. The partial unique
-- index ProjectDocumentationInstruction_one_default_per_type allows exactly one
-- isDefault row per projectTypeValue; ProjectDocumentationInstruction_title_key
-- requires a globally unique title.
INSERT INTO "public"."ProjectDocumentationInstruction"
  ("title", "url", "projectTypeValue", "isDefault")
SELECT
  'Default: Project (documentation only) (DE/EN)',
  '/project-documentation-instructions/PROJECT_WITH_DOCUMENTATION_ONLY.pdf',
  'PROJECT_WITH_DOCUMENTATION_ONLY',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM "public"."ProjectDocumentationInstruction"
   WHERE "projectTypeValue" = 'PROJECT_WITH_DOCUMENTATION_ONLY'
     AND "isDefault"
);
