ALTER TABLE "public"."Course"
ADD COLUMN IF NOT EXISTS "projectProposalsEnabled" boolean;

COMMENT ON COLUMN "public"."Course"."projectProposalsEnabled" IS
'Per-course override of Program.projectProposalsEnabledByDefault. When NULL, the program default applies. Only effective when achievementCertificatePossible = true.';
