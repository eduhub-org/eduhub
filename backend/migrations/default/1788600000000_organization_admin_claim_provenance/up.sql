-- Provenance of an OrganizationAdmin grant, for the StuJo self-service claim flow.
--
-- Until now every grant was created by a human: a super-admin in
-- /manage/settings/access, or the StuJo ETL. Self-service onboarding lets an
-- employer claim an organization that has no job admin yet, so the grants need to
-- record how they came about and what the claimer asserted.
--
-- Both columns are SERVER-CONTROLLED: written only by the claimJobOrganization
-- action, never by any Hasura role (they are absent from the OrganizationAdmin
-- insert and update permissions). This follows JobPosting.termsAcceptedAt — a
-- forgeable or backdatable value would not evidence anything.

CREATE TABLE "public"."OrganizationAdminClaimVerification" (
  "value" text PRIMARY KEY,
  "comment" text
);

COMMENT ON TABLE "public"."OrganizationAdminClaimVerification" IS 'How a self-service OrganizationAdmin claim was verified. A grant with claimVerification IS NULL was created by a person (super-admin or ETL), not claimed.';

INSERT INTO "public"."OrganizationAdminClaimVerification" ("value", "comment") VALUES
  ('SELF_SERVICE_DOMAIN_VERIFIED', 'The claimer''s email domain matched the organization''s website or email domain'),
  ('SELF_SERVICE_UNVERIFIED', 'Self-service claim of an existing organization whose domain did not match; needs review'),
  ('NEW_ORGANIZATION', 'The claimer created the organization as part of the claim, so there was nothing to verify against');

ALTER TABLE "public"."OrganizationAdmin"
  ADD COLUMN "claimVerification" text NULL,
  ADD COLUMN "authorizationDeclaredAt" timestamptz NULL;

ALTER TABLE "public"."OrganizationAdmin"
  ADD CONSTRAINT "OrganizationAdmin_claimVerification_fkey"
  FOREIGN KEY ("claimVerification")
  REFERENCES "public"."OrganizationAdminClaimVerification"("value")
  ON UPDATE restrict ON DELETE restrict;

COMMENT ON COLUMN "public"."OrganizationAdmin"."claimVerification" IS 'How this grant was obtained, NULL when a person granted it. Server-controlled: written by the claimJobOrganization action only, never by a client, since the value is what tells a reviewer whether the claim needs checking.';
COMMENT ON COLUMN "public"."OrganizationAdmin"."authorizationDeclaredAt" IS 'When the claimer declared they are authorized to post job offers on behalf of this organization. Server-controlled, written by the claimJobOrganization action only, for the same reason as claimVerification.';
