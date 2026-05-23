INSERT INTO "public"."ProjectType"
  ("value", "comment", "requiresDocumentation", "requiresPresentation",
   "requiresExternalUrl", "requiresCoverImage")
SELECT
  'MINIMAL_PROJECT',
  'Minimal project: only a documentation upload is required.',
  "requiresDocumentation",
  "requiresPresentation",
  "requiresExternalUrl",
  "requiresCoverImage"
FROM "public"."ProjectType"
WHERE "value" = 'CLASSIC_PROJECT';

UPDATE "public"."ProjectDocumentationInstruction"
   SET "projectTypeValue" = 'MINIMAL_PROJECT',
       "url" = CASE
         WHEN "url" = '/project-documentation-instructions/CLASSIC_PROJECT.pdf'
           THEN '/project-documentation-instructions/MINIMAL_PROJECT.pdf'
         ELSE "url"
       END,
       "title" = CASE
         WHEN "title" = 'Default: Classic project (DE/EN)'
           THEN 'Default: Minimal project (DE/EN)'
         ELSE "title"
       END
 WHERE "projectTypeValue" = 'CLASSIC_PROJECT';

UPDATE "public"."Project"
   SET "type" = 'MINIMAL_PROJECT'
 WHERE "type" = 'CLASSIC_PROJECT';

UPDATE "public"."Program"
   SET "defaultProjectType" = 'MINIMAL_PROJECT'
 WHERE "defaultProjectType" = 'CLASSIC_PROJECT';

DELETE FROM "public"."ProjectType"
 WHERE "value" = 'CLASSIC_PROJECT';
