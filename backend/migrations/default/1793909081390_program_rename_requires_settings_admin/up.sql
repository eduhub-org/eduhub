-- Only super-admins and settings admins of a program's organization may rename it. The org admins
-- with per-type rights (canManageEvents/Courses/Degrees) keep editing a program's dates and other
-- settings, which Hasura's column permissions cannot tell apart per row, hence a trigger.
CREATE OR REPLACE FUNCTION "public"."program_rename_requires_settings_admin"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  session json;
  caller_role text;
BEGIN
  IF NEW."title" IS NOT DISTINCT FROM OLD."title"
     AND NEW."shortTitle" IS NOT DISTINCT FROM OLD."shortTitle" THEN
    RETURN NEW;
  END IF;

  -- A NULL setting means a direct DB / migration call, `admin` a super-admin: both exempt.
  session := current_setting('hasura.user', true)::json;
  caller_role := session ->> 'x-hasura-role';
  IF caller_role IS NULL OR caller_role = 'admin' THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM "public"."OrganizationAdmin"
    WHERE "organizationId" = NEW."organizationId"
      AND "userId"::text = lower(session ->> 'x-hasura-user-id')
      AND "canManageSettings" = true
  ) THEN
    RAISE EXCEPTION 'Only settings admins may rename program %', NEW."id"
      USING ERRCODE = 'insufficient_privilege', HINT = 'program_rename_requires_settings_admin';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "program_rename_requires_settings_admin"
BEFORE UPDATE OF "title", "shortTitle" ON "public"."Program"
FOR EACH ROW EXECUTE FUNCTION "public"."program_rename_requires_settings_admin"();
