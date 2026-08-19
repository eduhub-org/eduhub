-- Reverse order of up.sql: the instruction row must go before the ProjectType row
-- (ProjectDocumentationInstruction_projectTypeValue_fkey is ON DELETE RESTRICT).
--
-- Both DELETEs are deliberately unguarded. If a Project still references the
-- instruction (Project_documentationInstructionId_fkey), or a Project.type or
-- Program.defaultProjectType still references the type, the RESTRICT foreign keys
-- abort the rollback loudly instead of silently orphaning data.

DELETE FROM "public"."ProjectDocumentationInstruction"
 WHERE "projectTypeValue" = 'PROJECT_WITH_DOCUMENTATION_ONLY';

DELETE FROM "public"."ProjectType"
 WHERE "value" = 'PROJECT_WITH_DOCUMENTATION_ONLY';
