-- Org-admin bootstrapping rules for the OrganizationAdmin table:
--   A. The FIRST admin of an organization always gets canManageSettings = true, so every
--      organization has at least one user able to manage its admin team and settings.
--   B. An organization can never be left with zero settings admins by a non-admin caller
--      (super-admins / migrations bypass the guard so they can always clean up).
--   C. The first admin of an organization triggers seeding of one default Program per type
--      (COURSES / EVENTS / DEGREES), so a fresh organization has something to manage.

-- A. Force canManageSettings on the first admin of an organization.
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

-- C. Seed default programs when the just-inserted row is the organization's first admin.
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

-- B. Keep at least one settings admin per organization (guards UPDATE canManageSettings true->false
--    and DELETE of a settings admin). Super-admins and direct DB/migration callers are exempt.
CREATE OR REPLACE FUNCTION "public"."organization_admin_keep_last_settings_admin"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  caller_role text;
  org_id integer;
BEGIN
  -- Only the Hasura admin (super-admin) sets no/`admin` role here; org_admin_access and other
  -- non-admin roles are guarded. A NULL setting means a direct DB / migration call -> exempt.
  caller_role := current_setting('hasura.user', true)::json ->> 'x-hasura-role';
  IF caller_role IS NULL OR caller_role = 'admin' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD."canManageSettings" = true AND NEW."canManageSettings" = false THEN
      org_id := OLD."organizationId";
      IF NOT EXISTS (
        SELECT 1 FROM "public"."OrganizationAdmin"
        WHERE "organizationId" = org_id
          AND "canManageSettings" = true
          AND "id" <> OLD."id"
      ) THEN
        RAISE EXCEPTION 'Cannot remove the last settings admin of organization %', org_id
          USING ERRCODE = 'check_violation', HINT = 'last_settings_admin';
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD."canManageSettings" = true THEN
      org_id := OLD."organizationId";
      IF NOT EXISTS (
        SELECT 1 FROM "public"."OrganizationAdmin"
        WHERE "organizationId" = org_id
          AND "canManageSettings" = true
          AND "id" <> OLD."id"
      ) THEN
        RAISE EXCEPTION 'Cannot remove the last settings admin of organization %', org_id
          USING ERRCODE = 'check_violation', HINT = 'last_settings_admin';
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
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

CREATE TRIGGER "organization_admin_keep_last_settings_admin_update"
BEFORE UPDATE ON "public"."OrganizationAdmin"
FOR EACH ROW
EXECUTE PROCEDURE "public"."organization_admin_keep_last_settings_admin"();

CREATE TRIGGER "organization_admin_keep_last_settings_admin_delete"
BEFORE DELETE ON "public"."OrganizationAdmin"
FOR EACH ROW
EXECUTE PROCEDURE "public"."organization_admin_keep_last_settings_admin"();
