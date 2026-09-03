-- =============================================================================
-- Correct the lifecycle status/rating of the projects that were migrated from
-- the legacy achievement system, and enforce the COMPLETED <-> PASSED
-- invariant in the database.
--
-- Root cause
--   1780045613786_migrate_achievements_to_projects step 7 inserted EVERY
--   AchievementRecord as status = 'COMPLETED' (hardcoded, up.sql:376) while
--   copying the legacy rating verbatim (up.sql:377). AchievementRecord.rating
--   is NOT NULL DEFAULT 'UNRATED' (1684928825580), so legacy submissions that
--   were never reviewed - and submissions explicitly rated FAILED - became
--   completed projects.
--
--   ProjectStatus.COMPLETED means "reviewed and rated as passed", and the only
--   application path into it (UpdateProjectReviewVerdict) writes status and
--   rating in a single statement, so no code path could have produced these
--   rows. Nothing rejected them either: the Project table had no constraint
--   tying the two columns together, and the status chip falls back to the raw
--   status when the rating does not match, so the rows read as plain
--   "COMPLETED" in the UI for months.
--
-- Production state before this migration (all rows record-derived, unpublished)
--   COMPLETED + UNRATED   441, of which 433 created before 2026-04-01
--   COMPLETED + FAILED     48
--
-- Reclassification
--   FAILED                     -> INCOMPLETE. An explicit negative verdict;
--                                 INCOMPLETE + FAILED is the pairing the review
--                                 dialog itself writes for a rejection.
--   UNRATED, created before      -> rating PASSED, status stays COMPLETED. The
--   2026-04-01                    summer semester started on 2026-04-01, so
--                                 these submissions belong to semesters that
--                                 were already closed out and reviewed in the
--                                 legacy system even where no rating was ever
--                                 recorded (196 enrollments already hold an
--                                 achievement certificate earned through them).
--   UNRATED, created on or       -> SUBMITTED (step 5), i.e. back into the
--   after 2026-04-01              instructor review queue: the running semester
--                                 is still open, so these reviews are genuinely
--                                 pending. In production the 8 affected rows
--                                 were reopened ahead of this migration by hand
--                                 so they could also carry the submittedAt /
--                                 submittedBy of the original legacy upload,
--                                 which this migration cannot reconstruct for
--                                 rows it no longer finds in COMPLETED. Step 5
--                                 therefore only fires in environments that
--                                 replay the cut-over (fresh or seeded
--                                 databases), and is a no-op in production.
--
-- Triggers are disabled for the duration of the data steps. This is essential,
-- not cosmetic: the send_project_status_email event trigger fires on any UPDATE
-- of Project.status and would mail PROJECT_REJECTED / PROJECT_SUBMITTED to the
-- authors (and staff) of hundreds of long-finished projects. Disabling user
-- triggers also keeps updated_at untouched, so historical rows do not appear
-- freshly edited, and stops set_project_submitted_metadata from stamping
-- submittedAt = now() on a row step 5 reopens, which would misdate a
-- submission that happened long ago.
--
-- Every step is idempotent: the pre-migration snapshot below drives the
-- reclassification, so re-applying the migration is a no-op.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Snapshot every row this migration may touch, before touching it
--
-- Deliberately NOT tracked in Hasura metadata: it is a cut-over artefact, not
-- part of the API surface. down.sql restores from it; it can be dropped once
-- the reclassification has been reviewed in production.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."ProjectLegacyStatusBackup" (
  "projectId"   integer     NOT NULL,
  "status"      text        NOT NULL,
  "rating"      text,
  "ratingComment" text,
  "submittedAt" timestamptz,
  "submittedBy" uuid,
  "created_at"  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("projectId")
);

COMMENT ON TABLE "public"."ProjectLegacyStatusBackup"
  IS E'Pre-migration snapshot of the Project rows corrected by migration 1788435175704 (status = COMPLETED without rating = PASSED, produced by the achievement cut-over). Untracked in Hasura metadata on purpose; retained so the reclassification stays auditable and reversible, and may be dropped once verified.';

INSERT INTO "public"."ProjectLegacyStatusBackup"
  ("projectId", "status", "rating", "ratingComment", "submittedAt", "submittedBy")
SELECT p."id", p."status", p."rating", p."ratingComment", p."submittedAt", p."submittedBy"
  FROM "public"."Project" p
 WHERE p."status" = 'COMPLETED'
   AND p."rating" IS DISTINCT FROM 'PASSED'
ON CONFLICT ("projectId") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. Silence triggers for the data steps (see header)
-- -----------------------------------------------------------------------------
ALTER TABLE "public"."Project" DISABLE TRIGGER USER;

-- -----------------------------------------------------------------------------
-- 3. FAILED verdicts are rejections, not completions
-- -----------------------------------------------------------------------------
UPDATE "public"."Project" p
   SET "status" = 'INCOMPLETE'
  FROM "public"."ProjectLegacyStatusBackup" b
 WHERE b."projectId" = p."id"
   AND b."status" = 'COMPLETED'
   AND b."rating" = 'FAILED'
   AND p."status" = 'COMPLETED';

-- -----------------------------------------------------------------------------
-- 4. Unrated submissions from closed semesters count as reviewed and passed
-- -----------------------------------------------------------------------------
UPDATE "public"."Project" p
   SET "rating" = 'PASSED'
  FROM "public"."ProjectLegacyStatusBackup" b
 WHERE b."projectId" = p."id"
   AND b."status" = 'COMPLETED'
   AND b."rating" = 'UNRATED'
   AND p."legacyAchievementRecordId" IS NOT NULL
   AND p."created_at" < (timestamp '2026-04-01 00:00' AT TIME ZONE 'Europe/Berlin')
   AND p."status" = 'COMPLETED';

-- -----------------------------------------------------------------------------
-- 5. Anything still COMPLETED without a PASSED rating goes back into review
--
-- A no-op in production: the running-semester rows were already reopened by
-- hand (see header) and the two cohorts above are the rest of the population.
-- It is what keeps the constraint in step 7 applicable to every other
-- environment - a fresh or seeded database that replays the achievement
-- cut-over, or rows left NULL-rated by the status reconstruction in
-- 1784600000000_add_project_published. Reopening rather than inventing a
-- verdict: no rating is fabricated for a project nobody rated.
-- -----------------------------------------------------------------------------
UPDATE "public"."Project"
   SET "status"        = 'SUBMITTED',
       "rating"        = 'UNRATED',
       "ratingComment" = NULL,
       "sentBackAt"    = NULL
 WHERE "status" = 'COMPLETED'
   AND "rating" IS DISTINCT FROM 'PASSED';

-- -----------------------------------------------------------------------------
-- 6. Restore triggers
-- -----------------------------------------------------------------------------
ALTER TABLE "public"."Project" ENABLE TRIGGER USER;

-- -----------------------------------------------------------------------------
-- 7. Make the invariant the database's job
--
-- The application already writes status and rating together, and Hasura lets
-- user_access/instructor_access update "status" without "rating" under an empty
-- post-check, so this is the only place the pairing can actually be guaranteed.
-- -----------------------------------------------------------------------------
ALTER TABLE "public"."Project"
  DROP CONSTRAINT IF EXISTS "Project_completed_requires_passed_rating_check";

ALTER TABLE "public"."Project"
  ADD CONSTRAINT "Project_completed_requires_passed_rating_check"
  CHECK ("status" <> 'COMPLETED' OR "rating" = 'PASSED');

COMMENT ON CONSTRAINT "Project_completed_requires_passed_rating_check" ON "public"."Project"
  IS 'Database-enforced rule: a project may only be COMPLETED when it carries the PASSED rating, matching the documented meaning of ProjectStatus.COMPLETED ("reviewed and rated as passed"). A rejection is INCOMPLETE + FAILED, a pending review is SUBMITTED + UNRATED.';
