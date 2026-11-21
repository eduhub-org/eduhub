UPDATE "public"."MailTemplateType"
SET "comment" = 'Sent to project owner/staff when a user requests to join a project'
WHERE "value" = 'PROJECT_JOIN_REQUESTED';

-- The proposer backfill is an irreversible data correction: the previous
-- proposers (template creators) are not recorded, so they cannot be restored.
