-- Reverse order of up.sql: the instruction row must go before the ProjectType row
-- (ProjectDocumentationInstruction_projectTypeValue_fkey is ON DELETE RESTRICT).
--
-- The instruction DELETE is narrowed to the exact row up.sql seeded so a rollback
-- never removes an instruction an administrator added for this type afterward.
-- Nothing else is guarded: if a Project still references the instruction
-- (Project_documentationInstructionId_fkey), or a Project.type or
-- Program.defaultProjectType still references the type, the RESTRICT foreign keys
-- abort the rollback loudly instead of silently orphaning data.

DELETE FROM "public"."ProjectDocumentationInstruction"
 WHERE "projectTypeValue" = 'PROJECT_WITH_DOCUMENTATION_ONLY'
   AND "title" = 'Default: Project (documentation only) (DE/EN)'
   AND "url" = '/project-documentation-instructions/PROJECT_WITH_DOCUMENTATION_ONLY.pdf'
   AND "isDefault" = true;

DELETE FROM "public"."ProjectType"
 WHERE "value" = 'PROJECT_WITH_DOCUMENTATION_ONLY';
