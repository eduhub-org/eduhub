ALTER TABLE "public"."Project"
ADD COLUMN IF NOT EXISTS "submittedBy" uuid;

COMMENT ON COLUMN "public"."Project"."submittedBy" IS
'User who issued the most recent SUBMITTED transition. Set via a Hasura permission preset (x-hasura-user-id) so the client cannot impersonate another author.';
