-- Reverse the per-type default instruction wiring.

DROP TRIGGER IF EXISTS "Project_instruction_matches_type_trg" ON "public"."Project";
DROP FUNCTION IF EXISTS "public"."check_project_instruction_matches_type"();

DROP INDEX IF EXISTS "public"."ProjectDocumentationInstruction_one_default_per_type";
DROP INDEX IF EXISTS "public"."ProjectDocumentationInstruction_projectTypeValue_idx";

ALTER TABLE "public"."ProjectDocumentationInstruction"
  DROP CONSTRAINT IF EXISTS "ProjectDocumentationInstruction_projectTypeValue_fkey";

-- Wipe seeded default rows before dropping the columns we just added. Down
-- migrations in dev must not silently leave orphaned data; if any Project
-- references one of these rows the existing FK on
-- Project.documentationInstructionId refuses the DELETE and the rollback
-- fails loudly, which is the desired behaviour.
DELETE FROM "public"."ProjectDocumentationInstruction"
 WHERE "isDefault" = true;

ALTER TABLE "public"."ProjectDocumentationInstruction"
  DROP COLUMN IF EXISTS "isDefault",
  DROP COLUMN IF EXISTS "projectTypeValue";

-- Re-introduce NOT NULL on url; if a row created in dev still has NULL url
-- (because no PDF was uploaded), the rollback will fail loudly here so the
-- developer can decide whether to delete it or upload a placeholder first.
ALTER TABLE "public"."ProjectDocumentationInstruction"
  ALTER COLUMN "url" SET NOT NULL;

-- Refuse to drop the new project types if any Project or Program references
-- them, mirroring the safety net in the matching forward migration that
-- introduced the original catalog.
DELETE FROM "public"."ProjectType"
 WHERE "value" IN (
   'PRESENTATION_WITHOUT_DOCUMENTATION',
   'PRESENTATION_AND_LINK_WITHOUT_DOCUMENTATION'
 );
