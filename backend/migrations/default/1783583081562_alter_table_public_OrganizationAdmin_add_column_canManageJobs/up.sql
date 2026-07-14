-- Capability flag for the StuJo job board, mirroring canManageCourses /
-- canManageEvents / canManageSettings / canManageDegrees.
ALTER TABLE "public"."OrganizationAdmin"
  ADD COLUMN "canManageJobs" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "public"."OrganizationAdmin"."canManageJobs" IS 'May create and manage job postings for this organization';
