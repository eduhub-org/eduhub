-- Instructors may upload their own documentation instructions. Ownership lives in
-- createdByUserId; NULL keeps the historical meaning "platform / admin-maintained",
-- so every existing row (including admin-created non-default ones) stays visible to
-- every instructor and today's behaviour is preserved without a backfill.

ALTER TABLE "public"."ProjectDocumentationInstruction"
  ADD COLUMN "createdByUserId" uuid NULL;

COMMENT ON COLUMN "public"."ProjectDocumentationInstruction"."createdByUserId" IS
  E'Instructor who uploaded this instruction. NULL = platform/admin-maintained: visible to every instructor, writable only by admins. A non-NULL value scopes the row to that user via Hasura select/update permissions and is stamped server-side by an insert preset, never by the client.';

-- ON DELETE RESTRICT, not SET NULL: user removal in this codebase is anonymisation
-- (functions/callNodeFunction/anonymizeUser keeps the User row with status DELETED),
-- so RESTRICT never blocks the real deletion path, while SET NULL would silently
-- promote a departed instructor's private instruction to a platform-wide one.
-- Mirrors Project_proposedByUserId_fkey.
ALTER TABLE "public"."ProjectDocumentationInstruction"
  ADD CONSTRAINT "ProjectDocumentationInstruction_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "public"."User" ("id")
  ON UPDATE RESTRICT ON DELETE RESTRICT;

CREATE INDEX "ProjectDocumentationInstruction_createdByUserId_idx"
  ON "public"."ProjectDocumentationInstruction" ("createdByUserId");

-- Title uniqueness was global. Instructors now pick titles, so a global unique
-- constraint would (a) reject a title whose owner the caller cannot even see and
-- (b) leak the existence of other instructors' titles. Keep global uniqueness for
-- the platform catalogue and scope instructor titles to their owner.
ALTER TABLE "public"."ProjectDocumentationInstruction"
  DROP CONSTRAINT "ProjectDocumentationInstruction_title_key";

CREATE UNIQUE INDEX "ProjectDocumentationInstruction_platform_title_key"
  ON "public"."ProjectDocumentationInstruction" ("title")
  WHERE "createdByUserId" IS NULL;

CREATE UNIQUE INDEX "ProjectDocumentationInstruction_owner_title_key"
  ON "public"."ProjectDocumentationInstruction" ("createdByUserId", "title")
  WHERE "createdByUserId" IS NOT NULL;

-- Instructors need UPDATE on "url" for the 3-step create (insert -> upload -> set
-- url) and for PDF replacement, which would otherwise let them point an
-- instruction at any public object in the bucket. Constrain owned rows to the
-- prefix the saveProjectDocumentationInstruction action writes. Platform rows are
-- untouched: they hold either GCS keys or the seeded
-- '/project-documentation-instructions/...' static paths.
ALTER TABLE "public"."ProjectDocumentationInstruction"
  ADD CONSTRAINT "ProjectDocumentationInstruction_owned_url_prefix_check"
  CHECK (
    "createdByUserId" IS NULL
    OR "url" IS NULL
    OR "url" LIKE 'project-docs-instructions/public/%'
  );

-- A type default belongs to the platform catalogue and stays visible to every
-- instructor, so it must never be personally owned. setProjectDocumentation-
-- InstructionDefault already refuses to promote an owned row; this makes the
-- invariant structural, so a privileged mutation or a data repair cannot create a
-- default that only its owner can see (and that its owner could not manage either,
-- because the update/delete permissions exclude isDefault rows).
ALTER TABLE "public"."ProjectDocumentationInstruction"
  ADD CONSTRAINT "ProjectDocumentationInstruction_default_is_platform_check"
  CHECK (
    "isDefault" IS NOT TRUE
    OR "createdByUserId" IS NULL
  );
