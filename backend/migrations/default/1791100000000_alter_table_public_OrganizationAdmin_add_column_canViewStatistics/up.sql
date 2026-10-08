ALTER TABLE "public"."OrganizationAdmin"
  ADD COLUMN "canViewStatistics" boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN "public"."OrganizationAdmin"."canViewStatistics" IS E'Allows the organization admin to view the statistics (applications, courses, sessions, attendances, certificates) of all programs of the organization';
