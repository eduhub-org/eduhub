ALTER TABLE "public"."OrganizationAdmin"
  DROP CONSTRAINT IF EXISTS "OrganizationAdmin_claimVerification_fkey";

ALTER TABLE "public"."OrganizationAdmin"
  DROP COLUMN IF EXISTS "authorizationDeclaredAt",
  DROP COLUMN IF EXISTS "claimVerification";

DROP TABLE IF EXISTS "public"."OrganizationAdminClaimVerification";
