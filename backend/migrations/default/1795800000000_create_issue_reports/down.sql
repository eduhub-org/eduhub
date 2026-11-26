ALTER TABLE "public"."AssistantFeedback" DROP CONSTRAINT IF EXISTS "AssistantFeedback_conversation_or_comment";
DELETE FROM "public"."AssistantFeedback" WHERE "conversation" IS NULL;
ALTER TABLE "public"."AssistantFeedback" ALTER COLUMN "conversation" SET NOT NULL;

DROP TABLE IF EXISTS "public"."IssueReportSummary";
DROP TABLE IF EXISTS "public"."IssueReportVote";
DROP FUNCTION IF EXISTS "public"."issue_report_vote_set_is_reporter"();
DROP FUNCTION IF EXISTS "public"."issue_report_people_affected"("public"."IssueReport");
DROP TABLE IF EXISTS "public"."IssueReport";
DROP FUNCTION IF EXISTS "public"."issue_report_limit_per_day"();
DROP FUNCTION IF EXISTS "public"."issue_report_set_closed_at"();
DROP TABLE IF EXISTS "public"."IssueReportPriority";
DROP TABLE IF EXISTS "public"."IssueReportStatus";
DROP TABLE IF EXISTS "public"."IssueReportType";
