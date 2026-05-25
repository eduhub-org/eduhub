-- Reverse the rename of the "documentation instruction" concept back to "documentation template".

ALTER TABLE "public"."Project"
  DROP CONSTRAINT IF EXISTS "Project_ongoing_requires_type_and_instruction_check";

ALTER TABLE "public"."Project"
  DROP CONSTRAINT IF EXISTS "Project_documentationInstructionId_fkey";

ALTER TRIGGER "set_public_ProjectDocumentationInstruction_updated_at"
  ON "public"."ProjectDocumentationInstruction"
  RENAME TO "set_public_ProjectDocumentationTemplate_updated_at";

ALTER TABLE "public"."ProjectDocumentationInstruction"
  RENAME CONSTRAINT "ProjectDocumentationInstruction_title_key" TO "ProjectDocumentationTemplate_title_key";

ALTER TABLE "public"."ProjectDocumentationInstruction"
  RENAME CONSTRAINT "ProjectDocumentationInstruction_pkey" TO "ProjectDocumentationTemplate_pkey";

ALTER TABLE "public"."ProjectDocumentationInstruction"
  RENAME TO "ProjectDocumentationTemplate";

ALTER TABLE "public"."Project"
  RENAME COLUMN "documentationInstructionId" TO "documentationTemplateId";

ALTER INDEX IF EXISTS "Project_documentationInstructionId_idx"
  RENAME TO "Project_documentationTemplateId_idx";

ALTER TABLE "public"."Project"
  ADD CONSTRAINT "Project_documentationTemplateId_fkey"
  FOREIGN KEY ("documentationTemplateId")
  REFERENCES "public"."ProjectDocumentationTemplate" ("id")
  ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE "public"."Project"
  ADD CONSTRAINT "Project_ongoing_requires_type_and_template_check"
  CHECK (
    "status" = 'PROPOSED'
    OR ("type" IS NOT NULL AND "documentationTemplateId" IS NOT NULL)
  );

COMMENT ON CONSTRAINT "Project_ongoing_requires_type_and_template_check" ON "public"."Project"
  IS 'Database-enforced rule: a project may only leave PROPOSED status (to ONGOING, SUBMITTED, COMPLETED, INCOMPLETE, or PUBLISHED) once both type and documentationTemplateId are set.';

COMMENT ON TABLE "public"."ProjectDocumentationTemplate"
  IS E'Reusable documentation template (PDF or similar) referenced by Project.documentationTemplateId. Parallel to AchievementDocumentationTemplate, which is kept untouched until Step 2.';
