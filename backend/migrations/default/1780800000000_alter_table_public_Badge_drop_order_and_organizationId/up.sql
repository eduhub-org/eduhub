-- Badges are a small, globally-managed list; the per-badge display order and the
-- organization scoping are not used, so drop both columns.
DROP INDEX IF EXISTS "public"."Badge_organizationId_idx";
ALTER TABLE "public"."Badge" DROP CONSTRAINT IF EXISTS "Badge_organizationId_fkey";
ALTER TABLE "public"."Badge" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "public"."Badge" DROP COLUMN IF EXISTS "order";
