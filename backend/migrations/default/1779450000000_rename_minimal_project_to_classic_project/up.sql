-- Rename ProjectType MINIMAL_PROJECT → CLASSIC_PROJECT.
-- "value" is the primary key; FKs use ON UPDATE RESTRICT, so we insert the new
-- row, repoint dependents, then delete the old row.

INSERT INTO "public"."ProjectType"
  ("value", "comment", "requiresDocumentation", "requiresPresentation",
   "requiresExternalUrl", "requiresCoverImage")
SELECT
  'CLASSIC_PROJECT',
  'Classic project: only a documentation upload is required.',
  "requiresDocumentation",
  "requiresPresentation",
  "requiresExternalUrl",
  "requiresCoverImage"
FROM "public"."ProjectType"
WHERE "value" = 'MINIMAL_PROJECT';

-- Instructions before projects: Project_instruction_matches_type_trg requires
-- documentationInstructionId.projectTypeValue = Project.type on UPDATE.
UPDATE "public"."ProjectDocumentationInstruction"
   SET "projectTypeValue" = 'CLASSIC_PROJECT',
       "url" = CASE
         WHEN "url" = '/project-documentation-instructions/MINIMAL_PROJECT.pdf'
           THEN '/project-documentation-instructions/CLASSIC_PROJECT.pdf'
         ELSE "url"
       END,
       "title" = CASE
         WHEN "title" = 'Default: Minimal project (DE/EN)'
           THEN 'Default: Classic project (DE/EN)'
         ELSE "title"
       END
 WHERE "projectTypeValue" = 'MINIMAL_PROJECT';

UPDATE "public"."Project"
   SET "type" = 'CLASSIC_PROJECT'
 WHERE "type" = 'MINIMAL_PROJECT';

UPDATE "public"."Program"
   SET "defaultProjectType" = 'CLASSIC_PROJECT'
 WHERE "defaultProjectType" = 'MINIMAL_PROJECT';

DELETE FROM "public"."ProjectType"
 WHERE "value" = 'MINIMAL_PROJECT';
