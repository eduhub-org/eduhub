-- =============================================================================
-- Put the backfilled projects back to the rating they carried before, from the
-- snapshot. Restoring by predicate is not possible here: after the backfill
-- these rows are indistinguishable from the 1009 legacy projects that arrived
-- as PASSED on their own.
--
-- Only rating changes, so no status email is in scope; the triggers are still
-- suppressed to keep the rollback from enqueuing pointless webhook deliveries.
-- =============================================================================

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

UPDATE "public"."Project" p
   SET "rating" = b."rating"
  FROM "migration_backup"."project_rating_1788269100001" b
 WHERE b."id" = p."id";

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

DROP TABLE IF EXISTS "migration_backup"."project_rating_1788269100001";
