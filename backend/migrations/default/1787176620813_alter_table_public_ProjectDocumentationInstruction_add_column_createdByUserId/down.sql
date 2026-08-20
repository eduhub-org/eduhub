ALTER TABLE "public"."ProjectDocumentationInstruction"
  DROP CONSTRAINT IF EXISTS "ProjectDocumentationInstruction_default_is_platform_check";

ALTER TABLE "public"."ProjectDocumentationInstruction"
  DROP CONSTRAINT IF EXISTS "ProjectDocumentationInstruction_owned_url_prefix_check";

DROP INDEX IF EXISTS "public"."ProjectDocumentationInstruction_owner_title_key";
DROP INDEX IF EXISTS "public"."ProjectDocumentationInstruction_platform_title_key";

-- Fails loudly if instructor uploads introduced titles that collide globally; the
-- developer then decides whether to rename or delete them before rolling back.
ALTER TABLE "public"."ProjectDocumentationInstruction"
  ADD CONSTRAINT "ProjectDocumentationInstruction_title_key" UNIQUE ("title");

DROP INDEX IF EXISTS "public"."ProjectDocumentationInstruction_createdByUserId_idx";

ALTER TABLE "public"."ProjectDocumentationInstruction"
  DROP CONSTRAINT IF EXISTS "ProjectDocumentationInstruction_createdByUserId_fkey";

ALTER TABLE "public"."ProjectDocumentationInstruction"
  DROP COLUMN IF EXISTS "createdByUserId";
