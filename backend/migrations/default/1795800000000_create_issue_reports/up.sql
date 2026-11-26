-- Bug reports and feature ideas collected by the Assistant (issue #2234).
-- Users report through the Assistant only; admins triage on /manage/reports; a weekly cron writes
-- an English summary (IssueReportSummary). The userId of reports and votes is removed 6 months
-- after a report is closed (anonymize_closed_issue_reports).

CREATE TABLE "public"."IssueReportType" ("value" text NOT NULL, "comment" text NOT NULL, PRIMARY KEY ("value"));
INSERT INTO "public"."IssueReportType" ("value", "comment") VALUES
  ('BUG', 'Something on the platform does not work as expected'),
  ('FEATURE', 'An idea for a new or better feature');

CREATE TABLE "public"."IssueReportStatus" ("value" text NOT NULL, "comment" text NOT NULL, PRIMARY KEY ("value"));
INSERT INTO "public"."IssueReportStatus" ("value", "comment") VALUES
  ('NEW', 'Not looked at yet'),
  ('PLANNED', 'Accepted and planned'),
  ('IN_PROGRESS', 'Being worked on'),
  ('DONE', 'Fixed or built'),
  ('DECLINED', 'Will not be done'),
  ('DUPLICATE', 'Same as another report (duplicateOfId)');

CREATE TABLE "public"."IssueReportPriority" ("value" text NOT NULL, "comment" text NOT NULL, PRIMARY KEY ("value"));
INSERT INTO "public"."IssueReportPriority" ("value", "comment") VALUES
  ('HIGH', 'High priority'),
  ('MEDIUM', 'Medium priority'),
  ('LOW', 'Low priority');

CREATE TABLE "public"."IssueReport" (
  "id"             serial      NOT NULL,
  "type"           text        NOT NULL,
  "title"          text        NOT NULL CHECK (char_length("title") BETWEEN 1 AND 200),
  "description"    text        NOT NULL CHECK (char_length("description") BETWEEN 1 AND 4000),
  "route"          text        CHECK (char_length("route") <= 300),
  "role"           text        CHECK (char_length("role") <= 50),
  "locale"         text        CHECK (char_length("locale") <= 10),
  "userId"         uuid,
  "status"         text        NOT NULL DEFAULT 'NEW',
  "priority"       text,
  "duplicateOfId"  integer,
  "publicNote"     text        CHECK (char_length("publicNote") <= 2000),
  "githubIssueUrl" text        CHECK (char_length("githubIssueUrl") <= 500),
  "closedAt"       timestamptz,
  "created_at"     timestamptz NOT NULL DEFAULT now(),
  "updated_at"     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "IssueReport_type_fkey" FOREIGN KEY ("type") REFERENCES "public"."IssueReportType"("value") ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT "IssueReport_status_fkey" FOREIGN KEY ("status") REFERENCES "public"."IssueReportStatus"("value") ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT "IssueReport_priority_fkey" FOREIGN KEY ("priority") REFERENCES "public"."IssueReportPriority"("value") ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT "IssueReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "IssueReport_duplicateOfId_fkey" FOREIGN KEY ("duplicateOfId") REFERENCES "public"."IssueReport"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "IssueReport_not_duplicate_of_itself" CHECK ("duplicateOfId" IS NULL OR "duplicateOfId" <> "id"),
  -- DUPLICATE always names the report it duplicates (the admin page sets both together).
  CONSTRAINT "IssueReport_duplicate_has_original" CHECK ("status" <> 'DUPLICATE' OR "duplicateOfId" IS NOT NULL)
);
COMMENT ON TABLE "public"."IssueReport" IS E'Bug reports and feature ideas sent through the Assistant (issue #2234); triaged by admins.';
CREATE INDEX "IssueReport_userId_idx" ON "public"."IssueReport" ("userId");
CREATE INDEX "IssueReport_status_idx" ON "public"."IssueReport" ("status");
CREATE INDEX "IssueReport_created_at_idx" ON "public"."IssueReport" ("created_at");

CREATE TRIGGER "set_public_IssueReport_updated_at"
BEFORE UPDATE ON "public"."IssueReport"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();

-- closedAt is set when a report reaches DONE, DECLINED or DUPLICATE and cleared when it is
-- reopened, so the 6-month anonymization counts from the actual close, whoever changed it.
CREATE OR REPLACE FUNCTION "public"."issue_report_set_closed_at"()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."status" IN ('DONE', 'DECLINED', 'DUPLICATE') THEN
    IF TG_OP = 'INSERT' OR OLD."status" NOT IN ('DONE', 'DECLINED', 'DUPLICATE') THEN
      NEW."closedAt" := now();
    END IF;
  ELSE
    NEW."closedAt" := NULL;
  END IF;
  IF NEW."status" <> 'DUPLICATE' THEN
    NEW."duplicateOfId" := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "issue_report_set_closed_at"
BEFORE INSERT OR UPDATE OF "status", "duplicateOfId" ON "public"."IssueReport"
FOR EACH ROW
EXECUTE PROCEDURE "public"."issue_report_set_closed_at"();

-- At most 5 new reports per person in 24 hours, for every writer, also direct GraphQL inserts (the
-- endpoint checks first only to answer with a friendly message). Withdrawn reports are deleted and
-- no longer count; they leave nothing behind either.
CREATE OR REPLACE FUNCTION "public"."issue_report_limit_per_day"()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."userId" IS NOT NULL AND (
    SELECT count(*) FROM "public"."IssueReport" r
    WHERE r."userId" = NEW."userId" AND r."created_at" > now() - interval '24 hours'
  ) >= 5 THEN
    RAISE EXCEPTION 'REPORT_LIMIT_REACHED' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "issue_report_limit_per_day"
BEFORE INSERT ON "public"."IssueReport"
FOR EACH ROW
EXECUTE PROCEDURE "public"."issue_report_limit_per_day"();

-- One row per person affected: the reporter (isReporter) and everyone who added their voice.
-- `summary` is the text that person saw: their own report's title, or the Assistant's summary of
-- someone else's report. Users never see another person's title or description.
CREATE TABLE "public"."IssueReportVote" (
  "id"            serial      NOT NULL,
  "issueReportId" integer     NOT NULL,
  "userId"        uuid,
  "summary"       text        NOT NULL CHECK (char_length("summary") BETWEEN 1 AND 500),
  "isReporter"    boolean     NOT NULL DEFAULT false,
  "created_at"    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "IssueReportVote_issueReportId_fkey" FOREIGN KEY ("issueReportId") REFERENCES "public"."IssueReport"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "IssueReportVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "IssueReportVote_issueReportId_userId_key" UNIQUE ("issueReportId", "userId")
);
COMMENT ON TABLE "public"."IssueReportVote" IS E'People affected by an IssueReport: the reporter and everyone who added their voice (issue #2234).';
CREATE INDEX "IssueReportVote_userId_idx" ON "public"."IssueReportVote" ("userId");

-- isReporter is derived on the server, never taken from the client.
CREATE OR REPLACE FUNCTION "public"."issue_report_vote_set_is_reporter"()
RETURNS TRIGGER AS $$
BEGIN
  NEW."isReporter" := COALESCE(
    (SELECT r."userId" = NEW."userId" FROM "public"."IssueReport" r WHERE r."id" = NEW."issueReportId"),
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "issue_report_vote_set_is_reporter"
BEFORE INSERT ON "public"."IssueReportVote"
FOR EACH ROW
EXECUTE PROCEDURE "public"."issue_report_vote_set_is_reporter"();

-- People affected by a report: its own votes plus those on reports marked as its duplicates. A
-- computed field, so the admin page can show and sort by the same number.
CREATE OR REPLACE FUNCTION "public"."issue_report_people_affected"(report_row "public"."IssueReport")
RETURNS integer AS $$
  SELECT count(*)::integer FROM "public"."IssueReportVote" v
  WHERE v."issueReportId" = report_row."id"
     OR v."issueReportId" IN (SELECT d."id" FROM "public"."IssueReport" d WHERE d."duplicateOfId" = report_row."id")
$$ LANGUAGE sql STABLE;

-- The weekly summary written by the generate_issue_report_summary cron (English, Markdown).
CREATE TABLE "public"."IssueReportSummary" (
  "id"            serial      NOT NULL,
  "periodStart"   timestamptz NOT NULL,
  "periodEnd"     timestamptz NOT NULL,
  "summary"       text        NOT NULL,
  "reportCount"   integer     NOT NULL DEFAULT 0,
  "feedbackCount" integer     NOT NULL DEFAULT 0,
  "model"         text,
  "inputTokens"   integer,
  "outputTokens"  integer,
  "costEur"       numeric(10, 4),
  "created_at"    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
COMMENT ON TABLE "public"."IssueReportSummary" IS E'Weekly English summary of issue reports and Assistant feedback, written by a model (issue #2234).';
CREATE INDEX "IssueReportSummary_created_at_idx" ON "public"."IssueReportSummary" ("created_at");

-- A 👎 may now be stored with only a comment, without the conversation.
ALTER TABLE "public"."AssistantFeedback" ALTER COLUMN "conversation" DROP NOT NULL;
ALTER TABLE "public"."AssistantFeedback"
  ADD CONSTRAINT "AssistantFeedback_conversation_or_comment" CHECK ("conversation" IS NOT NULL OR "comment" IS NOT NULL);
