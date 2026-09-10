-- Restore the bootstrap rules of 1784879499085 verbatim: forced canManageSettings
-- on an organization's first admin, and all three default programs seeded at once
-- for that first admin. Programs already seeded per capability are left in place
-- (this reverses triggers, not seeded data).

DROP TRIGGER IF EXISTS "organization_admin_seed_capability_programs" ON "public"."OrganizationAdmin";
DROP FUNCTION IF EXISTS "public"."organization_admin_seed_capability_programs"();

CREATE OR REPLACE FUNCTION "public"."organization_admin_force_first_settings"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Serialize concurrent inserts for the same organization so the "first admin" checks in
  -- this function and in the AFTER INSERT seed are reliable (prevents duplicate seeding).
  PERFORM pg_advisory_xact_lock(hashtext('OrganizationAdmin'), NEW."organizationId");

  IF NOT EXISTS (
    SELECT 1 FROM "public"."OrganizationAdmin"
    WHERE "organizationId" = NEW."organizationId"
  ) THEN
    NEW."canManageSettings" := true;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."organization_admin_seed_default_programs"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- AFTER INSERT: the new row is already present, so the first admin means exactly one row.
  IF (
    SELECT count(*) FROM "public"."OrganizationAdmin"
    WHERE "organizationId" = NEW."organizationId"
  ) = 1 THEN
    -- Idempotent: skip any type the organization already has a program for. `type` is the real
    -- discriminator; `title` is a friendly, editable label and `shortTitle` is a free-text label.
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
      ('COURSES', 'Kurse',   'COURSES'),
      ('EVENTS',  'Events',  'EVENTS'),
      ('DEGREES', 'Degrees', 'DEGREES')
    ) AS seed("type", "title", "shortTitle")
    WHERE NOT EXISTS (
      SELECT 1 FROM "public"."Program" p
      WHERE p."organizationId" = NEW."organizationId"
        AND p."type" = seed."type"
    );
  END IF;

  RETURN NULL; -- AFTER trigger; return value is ignored.
END;
$$;

CREATE TRIGGER "organization_admin_force_first_settings"
BEFORE INSERT ON "public"."OrganizationAdmin"
FOR EACH ROW
EXECUTE PROCEDURE "public"."organization_admin_force_first_settings"();

CREATE TRIGGER "organization_admin_seed_default_programs"
AFTER INSERT ON "public"."OrganizationAdmin"
FOR EACH ROW
EXECUTE PROCEDURE "public"."organization_admin_seed_default_programs"();
