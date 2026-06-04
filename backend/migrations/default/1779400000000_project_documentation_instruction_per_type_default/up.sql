-- Each ProjectType now owns one default ProjectDocumentationInstruction, and
-- every instruction belongs to exactly one ProjectType. Two new project types
-- (presentation-only flows) are added; their documentation upload is optional
-- but the instruction PDF still describes the presentation/link/cover
-- deliverables, so the existing Project_ongoing_requires_type_and_instruction
-- _check (which requires documentationInstructionId for any non-PROPOSED
-- project) is intentionally left unchanged.

-- 1. New project types -------------------------------------------------------

INSERT INTO "public"."ProjectType"
  ("value", "comment", "requiresDocumentation", "requiresPresentation",
   "requiresExternalUrl", "requiresCoverImage")
VALUES
  ('PRESENTATION_WITHOUT_DOCUMENTATION',
   'Publishable project: presentation and cover image; documentation upload is optional.',
   false, true,  false, true),
  ('PRESENTATION_AND_LINK_WITHOUT_DOCUMENTATION',
   'Publishable project: presentation, external link, and cover image; documentation upload is optional.',
   false, true,  true,  true);

-- 2. Extend ProjectDocumentationInstruction schema --------------------------

ALTER TABLE "public"."ProjectDocumentationInstruction"
  ADD COLUMN "projectTypeValue" text,
  ADD COLUMN "isDefault" boolean NOT NULL DEFAULT false,
  ALTER COLUMN "url" DROP NOT NULL;

-- 3. Backfill projectTypeValue for any pre-existing instructions ----------
--
-- Staging and production are empty at this point (confirmed by product
-- owner), but dev environments may have rows referenced by Project. We do
-- NOT delete those rows; instead we set projectTypeValue from whichever
-- Project type currently uses them (or 'CLASSIC_PROJECT' as a safe fallback
-- for orphan rows) and mark them as non-default. The seven seed rows below
-- will be the canonical defaults.
UPDATE "public"."ProjectDocumentationInstruction" AS pdi
   SET "projectTypeValue" = sub."type"
  FROM (
    SELECT DISTINCT ON (p."documentationInstructionId")
           p."documentationInstructionId" AS instruction_id,
           p."type"
      FROM "public"."Project" p
     WHERE p."documentationInstructionId" IS NOT NULL
       AND p."type" IS NOT NULL
     ORDER BY p."documentationInstructionId", p."id"
  ) AS sub
 WHERE pdi."id" = sub.instruction_id
   AND pdi."projectTypeValue" IS NULL;

UPDATE "public"."ProjectDocumentationInstruction"
   SET "projectTypeValue" = 'CLASSIC_PROJECT'
 WHERE "projectTypeValue" IS NULL;

-- 4. Seed one default instruction per type ---------------------------------
--
-- URLs point at static assets shipped from the Next.js `public/` folder so
-- the seven default PDFs are version-controlled alongside the migration.
-- Admin uploads continue to write GCS bucket paths; the frontend disting-
-- uishes the two by whether the URL starts with `/` (or `http`).
INSERT INTO "public"."ProjectDocumentationInstruction"
  ("title", "url", "projectTypeValue", "isDefault")
VALUES
  ('Default: Online course (DE/EN)',
   '/project-documentation-instructions/ONLINE_COURSE.pdf',
   'ONLINE_COURSE', true),
  ('Default: Classic project (DE/EN)',
   '/project-documentation-instructions/CLASSIC_PROJECT.pdf',
   'CLASSIC_PROJECT', true),
  ('Default: Project with link (DE/EN)',
   '/project-documentation-instructions/PROJECT_WITH_LINK.pdf',
   'PROJECT_WITH_LINK', true),
  ('Default: Project with presentation (DE/EN)',
   '/project-documentation-instructions/PROJECT_WITH_PRESENTATION.pdf',
   'PROJECT_WITH_PRESENTATION', true),
  ('Default: Project with link and presentation (DE/EN)',
   '/project-documentation-instructions/PROJECT_WITH_LINK_AND_PRESENTATION.pdf',
   'PROJECT_WITH_LINK_AND_PRESENTATION', true),
  ('Default: Presentation without documentation (DE/EN)',
   '/project-documentation-instructions/PRESENTATION_WITHOUT_DOCUMENTATION.pdf',
   'PRESENTATION_WITHOUT_DOCUMENTATION', true),
  ('Default: Presentation and link without documentation (DE/EN)',
   '/project-documentation-instructions/PRESENTATION_AND_LINK_WITHOUT_DOCUMENTATION.pdf',
   'PRESENTATION_AND_LINK_WITHOUT_DOCUMENTATION', true);

-- 5. Lock down projectTypeValue and add FK ---------------------------------

ALTER TABLE "public"."ProjectDocumentationInstruction"
  ALTER COLUMN "projectTypeValue" SET NOT NULL,
  ADD CONSTRAINT "ProjectDocumentationInstruction_projectTypeValue_fkey"
    FOREIGN KEY ("projectTypeValue")
    REFERENCES "public"."ProjectType" ("value")
    ON UPDATE RESTRICT ON DELETE RESTRICT;

CREATE INDEX "ProjectDocumentationInstruction_projectTypeValue_idx"
  ON "public"."ProjectDocumentationInstruction" ("projectTypeValue");

-- Partial unique index: at most one default per project type. "Exactly one"
-- is maintained operationally (seed + admin UI that only ever promotes a new
-- default via an atomic UPDATE).
CREATE UNIQUE INDEX "ProjectDocumentationInstruction_one_default_per_type"
  ON "public"."ProjectDocumentationInstruction" ("projectTypeValue")
  WHERE "isDefault";

COMMENT ON COLUMN "public"."ProjectDocumentationInstruction"."projectTypeValue"
  IS 'The single project type this instruction is suitable for.';
COMMENT ON COLUMN "public"."ProjectDocumentationInstruction"."isDefault"
  IS 'Exactly one instruction per projectTypeValue is marked default; admin UI swaps defaults atomically.';

-- 6. Project.documentationInstructionId must match Project.type ------------
--
-- Fires only on INSERT or on UPDATE of type/documentationInstructionId, so
-- any pre-existing inconsistencies in dev (e.g. an instruction backfilled to
-- a different type than one of the projects that historically referenced it)
-- are left untouched until those projects are edited.

CREATE OR REPLACE FUNCTION "public"."check_project_instruction_matches_type"()
RETURNS TRIGGER AS $$
DECLARE
  instruction_type text;
BEGIN
  IF NEW."type" IS NULL OR NEW."documentationInstructionId" IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT "projectTypeValue" INTO instruction_type
    FROM "public"."ProjectDocumentationInstruction"
   WHERE "id" = NEW."documentationInstructionId";
  IF instruction_type IS NULL THEN
    RAISE EXCEPTION 'ProjectDocumentationInstruction % not found', NEW."documentationInstructionId";
  END IF;
  IF instruction_type <> NEW."type" THEN
    RAISE EXCEPTION
      'ProjectDocumentationInstruction % is for projectType %, not % (Project.id=%)',
      NEW."documentationInstructionId", instruction_type, NEW."type", NEW."id";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Project_instruction_matches_type_trg"
  BEFORE INSERT OR UPDATE OF "type", "documentationInstructionId"
  ON "public"."Project"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."check_project_instruction_matches_type"();

COMMENT ON TRIGGER "Project_instruction_matches_type_trg"
  ON "public"."Project"
  IS 'Asserts that Project.documentationInstructionId references an instruction whose projectTypeValue equals Project.type.';
