-- Rework the org-admin bootstrap rules introduced by
-- 1784879499085_organization_admin_settings_and_default_programs.
--
-- Two things change, both so that a grant means exactly what it says:
--
--   A. canManageSettings is NEVER auto-granted. It used to be forced onto the
--      first admin of an organization. That is a broad capability — it carries
--      the right to manage the organization's admin team and, via the
--      OrganizationSettings view, to read its banking, tax and register data —
--      so it should be a conscious decision, made in /manage/settings/access,
--      not a side effect of being first. An organization may now legitimately
--      have no settings admin at all: that is the normal state of a job-board
--      employer who only ever posts job offers.
--
--   B. Default programs are seeded PER CAPABILITY, when someone first becomes
--      responsible for that content type, instead of all three at once for the
--      first admin. A job-board employer gets no Program rows, and an
--      organization that later gains a course admin gets its COURSES program
--      then. The old rule could not do this: its gate was "the organization has
--      exactly one admin", so a capability granted to the second admin — or
--      added to an existing admin by update — never seeded anything.
--
-- The keep_last_settings_admin guards are deliberately left alone. They stop an
-- organization that HAS a settings admin from dropping to none, which is still
-- worth preventing; they simply no longer describe a universal invariant.

-- A. Drop the forced-settings trigger.
--
-- Note it is also where the advisory lock was taken on the INSERT path, to make
-- the "first admin" check in the AFTER INSERT seed race-free. The seeding
-- function below now takes that lock itself.
DROP TRIGGER IF EXISTS "organization_admin_force_first_settings" ON "public"."OrganizationAdmin";
DROP FUNCTION IF EXISTS "public"."organization_admin_force_first_settings"();

-- B. Capability-driven program seeding, replacing organization_admin_seed_default_programs.
CREATE OR REPLACE FUNCTION "public"."organization_admin_seed_capability_programs"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Serialize concurrent grants for the same organization so two admins gaining
  -- the same capability at once cannot both pass the NOT EXISTS check below and
  -- seed the same program twice. Inherited from the dropped BEFORE INSERT
  -- trigger, which used to hold this lock for the seeding check.
  PERFORM pg_advisory_xact_lock(hashtext('OrganizationAdmin'), NEW."organizationId");

  -- One program per capability the grant carries, and only when the
  -- organization has no program of that type yet. That NOT EXISTS clause is the
  -- only gate: it makes the function idempotent, so it is safe to run for every
  -- grant and every flag change rather than only for an organization's first
  -- admin. A capability revoked later leaves its program in place — the content
  -- outlives the person responsible for it.
  INSERT INTO "public"."Program" (
    "type", "title", "shortTitle", "organizationId",
    "visibility", "defaultMaxMissedSessions",
    "lectureStart", "lectureEnd", "applicationStart",
    "defaultApplicationEnd", "achievementRecordUploadDeadline"
  )
  SELECT seed."type", seed."title", seed."shortTitle", NEW."organizationId",
         false, 2,
         CURRENT_DATE, CURRENT_DATE, CURRENT_DATE, CURRENT_DATE, CURRENT_DATE
  FROM (VALUES
    ('COURSES', 'Kurse',   'COURSES', NEW."canManageCourses"),
    ('EVENTS',  'Events',  'EVENTS',  NEW."canManageEvents"),
    ('DEGREES', 'Degrees', 'DEGREES', NEW."canManageDegrees")
  ) AS seed("type", "title", "shortTitle", "granted")
  WHERE seed."granted"
    AND NOT EXISTS (
      SELECT 1 FROM "public"."Program" p
      WHERE p."organizationId" = NEW."organizationId"
        AND p."type" = seed."type"
    );

  RETURN NULL; -- AFTER trigger; return value is ignored.
END;
$$;

DROP TRIGGER IF EXISTS "organization_admin_seed_default_programs" ON "public"."OrganizationAdmin";
DROP FUNCTION IF EXISTS "public"."organization_admin_seed_default_programs"();

-- Fires on UPDATE as well as INSERT: granting canManageCourses to an admin who
-- already exists must seed the COURSES program too, which an insert-only
-- trigger would miss.
CREATE TRIGGER "organization_admin_seed_capability_programs"
AFTER INSERT OR UPDATE OF "canManageCourses", "canManageEvents", "canManageDegrees"
ON "public"."OrganizationAdmin"
FOR EACH ROW
EXECUTE PROCEDURE "public"."organization_admin_seed_capability_programs"();
