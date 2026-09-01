-- =============================================================================
-- Legacy repair 2/2: rate the legacy COMPLETED projects that provably passed.
--
-- Same root cause as 1788269100000. The cut-over (1780045613786, step 7) forced
-- status = 'COMPLETED' on every migrated AchievementRecord while copying the
-- legacy rating as-is, and AchievementRecord.rating defaulted to 'UNRATED'
-- (1684928825580) - a value the old UI rarely overwrote. 441 projects across 78
-- courses are now COMPLETED + UNRATED, which the UI renders as:
--
--   * Kursprojekte table -> "Abgeschlossen" instead of "Bestanden", because
--     the COMPLETED_PASSED chip requires rating = PASSED.
--   * Teilnehmende table -> a grey "Projekt" dot for every author, because
--     that column reads Project.rating alone.
--   * Sammelaktion "Leistungszertifikate generieren" -> the author is silently
--     skipped; the bulk action filters on rating = PASSED
--     (CourseParticipationsTab/index.tsx).
--
-- WHY THIS IS NOT A BLANKET "COMPLETED => PASSED" BACKFILL
-- UNRATED is genuinely ambiguous: it covers both "approved, reviewer never
-- ticked the rating" and "never reviewed at all". Setting all 441 to PASSED
-- would award achievement certificates for work nobody signed off on.
--
-- So this migration only touches projects with independent evidence of
-- approval: an accepted author already holds an achievement certificate for
-- the linked course (CourseEnrollment.achievementCertificateURL). Under the
-- legacy system that certificate was issued off the very project being rated
-- here, so its existence is the reviewer's approval, recorded elsewhere.
--
-- Legacy projects WITHOUT that evidence are deliberately left UNRATED. They
-- keep the grey dot until their course team reviews them - a visible gap is
-- the correct outcome for work whose approval cannot be established. Query B
-- in the triage script lists them per course for that follow-up.
--
-- Only Project.rating changes, so "send_project_status_email" (armed on the
-- status column) is not in scope, and sendProjectEmail early-returns
-- NO_ACTION_NEEDED when the status is unchanged. The notify triggers are still
-- suppressed, to avoid enqueuing hundreds of webhook deliveries - each with a
-- 600s timeout and 10 retries - that would all do nothing.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Snapshot, which doubles as the definition of the affected set: the UPDATE
--    below joins it, so up and down operate on exactly the same rows and the
--    evidence predicate is stated once.
-- -----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS "migration_backup";
COMMENT ON SCHEMA "migration_backup" IS
  E'Pre-change snapshots taken by data-repair migrations so their down.sql can restore the exact rows they touched. Not tracked in Hasura metadata and never read by the application. A snapshot table can be dropped once its migration is settled in production.';

CREATE TABLE IF NOT EXISTS "migration_backup"."project_rating_1788269100001" (
  "id"          integer     NOT NULL PRIMARY KEY,
  "status"      text        NOT NULL,
  "rating"      text,
  "captured_at" timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE "migration_backup"."project_rating_1788269100001" IS
  E'Project.status/rating as they stood before migration 1788269100001 rated the legacy COMPLETED projects whose authors already held an achievement certificate.';

INSERT INTO "migration_backup"."project_rating_1788269100001" ("id", "status", "rating")
SELECT p."id", p."status", p."rating"
  FROM "public"."Project" p
 WHERE p."status" = 'COMPLETED'
   AND (p."rating" IS NULL OR p."rating" = 'UNRATED')
   AND p."legacyAchievementRecordId" IS NOT NULL
   AND EXISTS (
         SELECT 1
           FROM "public"."ProjectAuthor" pa
           JOIN "public"."ProjectCourse" pc
             ON pc."projectId" = p."id"
           JOIN "public"."CourseEnrollment" ce
             ON ce."userId" = pa."userId"
            AND ce."courseId" = pc."courseId"
          WHERE pa."projectId" = p."id"
            AND pa."participationStatus" = 'ACCEPTED'
            AND ce."achievementCertificateURL" IS NOT NULL
       )
ON CONFLICT ("id") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. Suppress the webhook fan-out for this transaction.
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
-- 3. The backfill. Re-running is a no-op: the rows are PASSED by then, so the
--    snapshot INSERT selects nothing new and this UPDATE matches nothing.
-- -----------------------------------------------------------------------------
UPDATE "public"."Project" p
   SET "rating" = 'PASSED'
  FROM "migration_backup"."project_rating_1788269100001" b
 WHERE b."id" = p."id"
   AND p."status" = 'COMPLETED'
   AND (p."rating" IS NULL OR p."rating" = 'UNRATED');

-- -----------------------------------------------------------------------------
-- 4. Restore the triggers before COMMIT.
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
