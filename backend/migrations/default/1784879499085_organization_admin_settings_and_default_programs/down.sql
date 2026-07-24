DROP TRIGGER IF EXISTS "organization_admin_keep_last_settings_admin_delete" ON "public"."OrganizationAdmin";
DROP TRIGGER IF EXISTS "organization_admin_keep_last_settings_admin_update" ON "public"."OrganizationAdmin";
DROP TRIGGER IF EXISTS "organization_admin_seed_default_programs" ON "public"."OrganizationAdmin";
DROP TRIGGER IF EXISTS "organization_admin_force_first_settings" ON "public"."OrganizationAdmin";

DROP FUNCTION IF EXISTS "public"."organization_admin_keep_last_settings_admin"();
DROP FUNCTION IF EXISTS "public"."organization_admin_seed_default_programs"();
DROP FUNCTION IF EXISTS "public"."organization_admin_force_first_settings"();

-- Note: default Program rows already seeded by trigger C are intentionally left in place
-- (this migration reverses schema/triggers, not seeded data).
