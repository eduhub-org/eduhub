-- A reviewed self-service claim: the state a super-admin sets after checking one.
--
-- SELF_SERVICE_UNVERIFIED marks a claim nothing corroborated, and the access screen flags every
-- such grant for review. Without a state to move it to, the flag stayed on the grant forever and a
-- reviewer had no way to record "I looked, this is fine" — so the marker could only ever be cleared
-- by revoking a legitimate grant.
--
-- Like the other values, this one is only ever written by something the claimer cannot reach:
-- claimVerification appears in no org_admin_access insert or update permission, so setting it needs
-- the admin role, which only a super-admin's token carries.
INSERT INTO "public"."OrganizationAdminClaimVerification" ("value", "comment") VALUES
  ('ADMIN_VERIFIED', 'A super-admin reviewed the self-service claim and confirmed the claimer may act for the organization');

-- The column comment predates the review state and claimed the action was the only writer. Still
-- server-controlled, but there are now two writers, both out of the claimer's reach.
COMMENT ON COLUMN "public"."OrganizationAdmin"."claimVerification" IS 'How this grant was obtained, NULL when a person granted it. Server-controlled: written by the claimJobOrganization action, and set to ADMIN_VERIFIED when a super-admin reviews the claim. Never writable by a client role, since the value is what tells a reviewer whether the claim needs checking.';
