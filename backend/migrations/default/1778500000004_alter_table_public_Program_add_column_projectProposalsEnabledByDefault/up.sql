ALTER TABLE "public"."Program"
ADD COLUMN IF NOT EXISTS "projectProposalsEnabledByDefault" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "public"."Program"."projectProposalsEnabledByDefault" IS
'Default value for Course.projectProposalsEnabled within this program. Controls whether course participants can propose new projects when the course also has achievementCertificatePossible enabled.';
