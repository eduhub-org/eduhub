ALTER TABLE "public"."IssueReport" DROP CONSTRAINT IF EXISTS "IssueReport_githubIssueNumber_key";
ALTER TABLE "public"."IssueReport" DROP COLUMN IF EXISTS "githubIssueNumber";
ALTER TABLE "public"."IssueReport" ADD COLUMN "githubIssueUrl" text CHECK (char_length("githubIssueUrl") <= 500);
