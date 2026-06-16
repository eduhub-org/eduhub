ALTER TABLE "public"."OrganizationAdmin"
  ADD COLUMN "canManageDegrees" boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN "public"."OrganizationAdmin"."canManageDegrees" IS E'Allows the organization admin to manage programs (and their courses) of type DEGREES for the organization';
