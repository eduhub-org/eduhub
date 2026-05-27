-- Rename the "documentation template" concept to "documentation instruction" to reflect
-- that the referenced PDFs are concrete instructions describing how project documentation
-- (or any other mandatory deliverables) should be composed. In some cases the entry is a
-- fillable PDF that can be completed directly (e.g. reflection questionnaires for online
-- courses).

ALTER TABLE "public"."Project"
  DROP CONSTRAINT IF EXISTS "Project_ongoing_requires_type_and_template_check";

ALTER TABLE "public"."Project"
  DROP CONSTRAINT IF EXISTS "Project_documentationTemplateId_fkey";

ALTER INDEX IF EXISTS "Project_documentationTemplateId_idx"
  RENAME TO "Project_documentationInstructionId_idx";

ALTER TABLE "public"."Project"
  RENAME COLUMN "documentationTemplateId" TO "documentationInstructionId";

ALTER TABLE "public"."ProjectDocumentationTemplate"
  RENAME TO "ProjectDocumentationInstruction";

ALTER TABLE "public"."ProjectDocumentationInstruction"
  RENAME CONSTRAINT "ProjectDocumentationTemplate_pkey" TO "ProjectDocumentationInstruction_pkey";

ALTER TABLE "public"."ProjectDocumentationInstruction"
  RENAME CONSTRAINT "ProjectDocumentationTemplate_title_key" TO "ProjectDocumentationInstruction_title_key";

ALTER TRIGGER "set_public_ProjectDocumentationTemplate_updated_at"
  ON "public"."ProjectDocumentationInstruction"
  RENAME TO "set_public_ProjectDocumentationInstruction_updated_at";

ALTER TABLE "public"."Project"
  ADD CONSTRAINT "Project_documentationInstructionId_fkey"
  FOREIGN KEY ("documentationInstructionId")
  REFERENCES "public"."ProjectDocumentationInstruction" ("id")
  ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE "public"."Project"
  ADD CONSTRAINT "Project_ongoing_requires_type_and_instruction_check"
  CHECK (
    "status" = 'PROPOSED'
    OR ("type" IS NOT NULL AND "documentationInstructionId" IS NOT NULL)
  );

COMMENT ON CONSTRAINT "Project_ongoing_requires_type_and_instruction_check" ON "public"."Project"
  IS 'Database-enforced rule: a project may only leave PROPOSED status (to ONGOING, SUBMITTED, COMPLETED, INCOMPLETE, or PUBLISHED) once both type and documentationInstructionId are set.';

COMMENT ON TABLE "public"."ProjectDocumentationInstruction"
  IS E'Reusable documentation instruction (PDF or similar) referenced by Project.documentationInstructionId. Each entry describes how the project documentation (or any other mandatory deliverables) should be composed; in some cases (e.g. reflection questionnaires for online courses) it is a fillable PDF that can be completed directly.';
