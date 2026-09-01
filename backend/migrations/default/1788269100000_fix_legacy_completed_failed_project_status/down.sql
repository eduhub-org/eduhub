-- =============================================================================
-- Restore the exact rows up.sql moved from COMPLETED to INCOMPLETE, from the
-- snapshot it took. Restoring by predicate instead would also drag back any
-- project a reviewer legitimately rejected after the cut-over.
--
-- The same email suppression applies in reverse: INCOMPLETE -> COMPLETED maps
-- to PROJECT_APPROVED in sendProjectEmail, so an unguarded rollback would mail
-- an approval notice for projects that were rejected years ago.
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
   SET "status" = b."status",
       "rating" = b."rating"
  FROM "migration_backup"."project_status_1788269100000" b
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

DROP TABLE IF EXISTS "migration_backup"."project_status_1788269100000";
