-- Two database-level guards for the self-service job claim, both closing races that a read
-- followed by a write cannot close on its own.

-- A. At most one self-service claim of an organization's job offers.
--
-- claimJobOrganization checks that nobody manages the organization's job offers before inserting
-- its grant, but that check reads a snapshot: two people claiming the same unclaimed organization
-- in the same moment can both pass it, and the unique constraint on (userId, organizationId) does
-- not help because they are different users. The loser would silently get access too.
--
-- Only SELF-SERVICE claims are constrained (claimVerification IS NOT NULL). A settings admin
-- granting canManageJobs to colleagues is normal and must keep working, which is why this cannot
-- be a partial unique index on canManageJobs alone.
CREATE OR REPLACE FUNCTION "public"."organization_admin_single_job_claim"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."claimVerification" IS NULL OR NEW."canManageJobs" IS NOT true THEN
    RETURN NEW;
  END IF;

  -- Same lock the capability seeding takes, so a concurrent claim for this organization waits here
  -- rather than reading a stale snapshot.
  PERFORM pg_advisory_xact_lock(hashtext('OrganizationAdmin'), NEW."organizationId");

  IF EXISTS (
    SELECT 1 FROM "public"."OrganizationAdmin"
    WHERE "organizationId" = NEW."organizationId"
      AND "canManageJobs" = true
      AND "userId" <> NEW."userId"
  ) THEN
    RAISE EXCEPTION 'Job offers of organization % are already managed by someone else', NEW."organizationId"
      USING ERRCODE = 'check_violation', HINT = 'job_claim_already_taken';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "organization_admin_single_job_claim"
BEFORE INSERT ON "public"."OrganizationAdmin"
FOR EACH ROW
EXECUTE PROCEDURE "public"."organization_admin_single_job_claim"();

-- B. One access-request mail per (organization, requester, recipient).
--
-- requestJobOrganizationAccess reads MailLog to rate-limit itself, which has the same
-- read-then-write gap: two concurrent requests can both find nothing and both fan out. Let the
-- database decide, exactly as MailLog_job_posting_mail_unique does for the posting mails.
--
-- The recipient is part of the key so that one mail per administrator is still allowed, and so a
-- delivery that failed for one administrator does not sit in the way of the others.
CREATE UNIQUE INDEX "MailLog_job_organization_access_request_unique"
  ON "public"."MailLog" (
    (metadata ->> 'type'),
    (metadata ->> 'organizationId'),
    (metadata ->> 'requesterUserId'),
    (metadata ->> 'adminUserId')
  )
  WHERE metadata ->> 'type' = 'JOB_ORGANIZATION_ACCESS_REQUEST';
