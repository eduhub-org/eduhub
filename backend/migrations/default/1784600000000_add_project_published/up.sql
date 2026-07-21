-- Showcase publication becomes an orthogonal boolean so the lifecycle status
-- (PROPOSED template, COMPLETED/passed, ...) is preserved when a project is
-- published. Previously status = 'PUBLISHED' replaced the lifecycle status.
ALTER TABLE "public"."Project"
  ADD COLUMN "published" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "public"."Project"."published" IS
  'Showcase visibility flag: true means the project is publicly published (home sliders, public showcase). Orthogonal to lifecycle, which stays in "status".';

-- Backfill: every row currently in the (now deprecated) PUBLISHED status keeps
-- its showcase visibility via published = true, while its lifecycle status is
-- restored to COMPLETED when it has at least one ACCEPTED author, otherwise to
-- PROPOSED (an open template that was surfaced publicly, e.g. project 9916).
--
-- Any row that reached PUBLISHED had already left PROPOSED, so it satisfies the
-- Project_ongoing_requires_type_and_instruction_check constraint (type and
-- documentationInstructionId are set); restoring it to COMPLETED is therefore
-- safe. suggestedForPublication is cleared so the restored COMPLETED status does
-- not resurface the "suggested for publication" chip on already-published rows.
UPDATE "public"."Project" AS p
SET
  "published" = true,
  "suggestedForPublication" = false,
  "status" = CASE
    WHEN EXISTS (
      SELECT 1
      FROM "public"."ProjectAuthor" pa
      WHERE pa."projectId" = p."id"
        AND pa."participationStatus" = 'ACCEPTED'
    ) THEN 'COMPLETED'
    ELSE 'PROPOSED'
  END
WHERE p."status" = 'PUBLISHED';
