UPDATE "public"."MailTemplateType"
SET "comment" = 'Sent to project owner/staff when a user requests to join a project'
WHERE "value" = 'PROJECT_JOIN_REQUESTED';

-- Restore the proposers the backfill replaced, again without touching
-- updated_at, then drop the saved rollback data.
ALTER TABLE "public"."Project" DISABLE TRIGGER "set_public_Project_updated_at";

UPDATE "public"."Project" AS p
SET "proposedByUserId" = b."previousProposedByUserId"
FROM "public"."ProjectProposerBackfill" AS b
WHERE b."projectId" = p."id";

ALTER TABLE "public"."Project" ENABLE TRIGGER "set_public_Project_updated_at";

DROP TABLE "public"."ProjectProposerBackfill";
