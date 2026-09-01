-- =============================================================================
-- Legacy repair 1/2: a rejected project must not sit in COMPLETED.
--
-- The achievement -> project cut-over (1780045613786, step 7) hardcoded
-- status = 'COMPLETED' for EVERY migrated AchievementRecord and copied the
-- legacy rating verbatim. 48 rows across 19 courses therefore carry
-- COMPLETED + FAILED, which renders as a contradiction:
--
--   * Kursprojekte table -> green "Abgeschlossen" chip. The "Nicht bestanden"
--     chip requires status = INCOMPLETE (projectStatusDisplay.ts,
--     resolveProjectStatusChipKey), so a rejected project reads as approved.
--   * Teilnehmende table -> the author's dot is already red, because that
--     column reads Project.rating alone.
--
-- The rating is the reviewer's actual verdict; the status simply never
-- followed it. Align the status and leave the rating untouched.
--
-- Scope is restricted to rows that came through the cut-over
-- (legacyAchievementRecordId IS NOT NULL). No non-legacy project is in this
-- state: ReviewProjectDialog has always written status and rating in one
-- mutation (approve -> COMPLETED+PASSED, reject -> INCOMPLETE+FAILED), and a
-- census confirmed all 121 native COMPLETED projects are PASSED.
--
-- -----------------------------------------------------------------------------
-- EMAIL SUPPRESSION - the reason this is not a bare UPDATE
-- -----------------------------------------------------------------------------
-- Project carries the Hasura event trigger "send_project_status_email", armed
-- on UPDATE of the status column, and sendProjectEmail maps
--   status -> INCOMPLETE  =>  PROJECT_REJECTED  =>  the accepted authors
-- Running this unguarded would mail a rejection notice to every author of 48
-- projects, for courses that ended years ago. The generated notify triggers are
-- therefore disabled for the duration of this transaction and restored before
-- it commits. The loop is a no-op on a database whose Hasura metadata has not
-- been applied yet (fresh dev DB), so the migration stays portable.
--
-- Deliberately NOT added here: a CHECK constraint pinning COMPLETED to PASSED
-- and INCOMPLETE to FAILED. Migration 2/2 cannot rate every legacy project, so
-- the constraint would fail on the remainder. It belongs in a later migration,
-- once the leftovers have been reviewed by their course teams.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Snapshot the rows this migration changes, so down.sql can restore exactly
--    those and nothing else. A blanket "INCOMPLETE+FAILED -> COMPLETED" reverse
--    would also revert projects that a reviewer legitimately rejected after the
--    cut-over.
-- -----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS "migration_backup";
COMMENT ON SCHEMA "migration_backup" IS
  E'Pre-change snapshots taken by data-repair migrations so their down.sql can restore the exact rows they touched. Not tracked in Hasura metadata and never read by the application. A snapshot table can be dropped once its migration is settled in production.';

CREATE TABLE IF NOT EXISTS "migration_backup"."project_status_1788269100000" (
  "id"          integer     NOT NULL PRIMARY KEY,
  "status"      text        NOT NULL,
  "rating"      text,
  "captured_at" timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE "migration_backup"."project_status_1788269100000" IS
  E'Project.status/rating as they stood before migration 1788269100000 moved legacy COMPLETED+FAILED projects to INCOMPLETE.';

INSERT INTO "migration_backup"."project_status_1788269100000" ("id", "status", "rating")
SELECT p."id", p."status", p."rating"
  FROM "public"."Project" p
 WHERE p."status" = 'COMPLETED'
   AND p."rating" = 'FAILED'
   AND p."legacyAchievementRecordId" IS NOT NULL
ON CONFLICT ("id") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. Suppress the project-status emails for this transaction.
-- -----------------------------------------------------------------------------
DO $suppress_notify$
DECLARE
  trg text;
BEGIN
  FOR trg IN
    SELECT t.tgname
      FROM pg_trigger t
     WHERE t.tgrelid = 'public."Project"'::regclass
       AND NOT t.tgisinternal
       AND t.tgname LIKE 'notify\_hasura\_%'
  LOOP
    EXECUTE format('ALTER TABLE "public"."Project" DISABLE TRIGGER %I', trg);
  END LOOP;
END
$suppress_notify$;

-- -----------------------------------------------------------------------------
-- 3. The repair itself.
-- -----------------------------------------------------------------------------
UPDATE "public"."Project"
   SET "status" = 'INCOMPLETE'
 WHERE "status" = 'COMPLETED'
   AND "rating" = 'FAILED'
   AND "legacyAchievementRecordId" IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 4. Restore the triggers. Must run before COMMIT; an aborted transaction rolls
--    the DISABLE back with everything else, so the table never stays unarmed.
-- -----------------------------------------------------------------------------
DO $restore_notify$
DECLARE
  trg text;
BEGIN
  FOR trg IN
    SELECT t.tgname
      FROM pg_trigger t
     WHERE t.tgrelid = 'public."Project"'::regclass
       AND NOT t.tgisinternal
       AND t.tgname LIKE 'notify\_hasura\_%'
  LOOP
    EXECUTE format('ALTER TABLE "public"."Project" ENABLE TRIGGER %I', trg);
  END LOOP;
END
$restore_notify$;
