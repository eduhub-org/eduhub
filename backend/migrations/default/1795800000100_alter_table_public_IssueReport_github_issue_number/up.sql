-- A report is linked to at most one GitHub issue in the configured repo, and an issue to at most
-- one report (a second report about the same thing is marked as a duplicate instead). The number
-- replaces the free-text URL: the repo is fixed per environment (GITHUB_ISSUE_REPO), so the URL is
-- derived. IssueReport was not released before this migration, so no URLs are carried over.
ALTER TABLE "public"."IssueReport" DROP COLUMN "githubIssueUrl";
ALTER TABLE "public"."IssueReport" ADD COLUMN "githubIssueNumber" integer CHECK ("githubIssueNumber" > 0);
ALTER TABLE "public"."IssueReport"
  ADD CONSTRAINT "IssueReport_githubIssueNumber_key" UNIQUE ("githubIssueNumber");
COMMENT ON COLUMN "public"."IssueReport"."githubIssueNumber" IS E'Issue in GITHUB_ISSUE_REPO this report is synced with (lib/github in edu-hub, reconcileIssueReportsWithGithub).';
