COMMENT ON COLUMN "public"."OrganizationAdmin"."claimVerification" IS 'How this grant was obtained, NULL when a person granted it. Server-controlled: written by the claimJobOrganization action only, never by a client, since the value is what tells a reviewer whether the claim needs checking.';

-- Grants that were confirmed fall back to the unverified state they were reviewed from, so the
-- foreign key still holds and the access screen flags them for review again.
UPDATE "public"."OrganizationAdmin"
  SET "claimVerification" = 'SELF_SERVICE_UNVERIFIED'
  WHERE "claimVerification" = 'ADMIN_VERIFIED';

DELETE FROM "public"."OrganizationAdminClaimVerification" WHERE "value" = 'ADMIN_VERIFIED';
