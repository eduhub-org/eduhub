-- Privacy policy versioning (docs/LEGAL_DOCUMENTS.md, "Changing the privacy
-- policy"). The policy is information, not a contract: nobody has to accept a
-- new version, but account holders are told once about material changes.
--
-- privacyNoticeSeenVersion is the PRIVACY_POLICY_VERSION
-- (frontend-nx/apps/edu-hub/components/legal/privacyPolicyVersion.ts) whose
-- "policy updated" notice the user dismissed. NULL means they never saw one.
ALTER TABLE "public"."User" ADD COLUMN "privacyNoticeSeenVersion" text NULL;
COMMENT ON COLUMN "public"."User"."privacyNoticeSeenVersion" IS
  E'Privacy policy version (YYYY-MM-DD) whose update notice the user dismissed; NULL if none.';
