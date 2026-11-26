import { env } from "../lib/config.js";
import { createHasuraClient } from "../lib/hasura.js";
import { createGithubClient, githubConfig, readIssue, renderFooter, statusFromIssue, updateFooter } from "../lib/github.js";

/**
 * Nightly safety net of the GitHub report sync: GitHub doesn't retry a failed webhook delivery,
 * so this compares every report linked to an issue with GitHub and corrects the report (status,
 * or the link when the issue was deleted or moved away) and the issue's footer (people
 * affected). The webhook (edu-hub /api/webhooks/github) does the same per event; both use the
 * same mapping (lib/github.js statusFromIssue).
 *
 * Off (skipped) until the GitHub App is configured. At most MAX_REPORTS per run, oldest change
 * first, so a run stays well inside callNodeFunction's timeout.
 */

export const MAX_REPORTS = 300;
const ISSUE_STATUSES = ["PLANNED", "IN_PROGRESS"];

const LINKED = `
  query ReconcileLinkedIssueReports($limit: Int!) {
    IssueReport(where: { githubIssueNumber: { _is_null: false } }, order_by: { updated_at: asc }, limit: $limit) {
      id status priority duplicateOfId githubIssueNumber peopleAffected
    }
  }
`;

const UPDATE = `
  mutation ReconcileIssueReport($id: Int!, $set: IssueReport_set_input!) {
    update_IssueReport_by_pk(pk_columns: { id: $id }, _set: $set) { id }
  }
`;

/** The change one report needs, or null; same rules as syncFromGithub in edu-hub's reportSync.ts. */
export const reportChange = (report, issue, { hasBoard, reportIdByIssue }) => {
  const target = statusFromIssue(issue);
  if (!issue || !target) return { githubIssueNumber: null };
  if (!hasBoard && ISSUE_STATUSES.includes(target) && ISSUE_STATUSES.includes(report.status)) return null;
  let duplicateOfId;
  if (target === "DUPLICATE" && issue.duplicateOfNumber) {
    const original = reportIdByIssue.get(issue.duplicateOfNumber);
    if (original && original !== report.id) duplicateOfId = original;
  }
  // DUPLICATE needs an original in EduHub (IssueReport_duplicate_has_original); without one it
  // reads as declined, unless an admin already set the link here.
  if (target === "DUPLICATE" && !duplicateOfId) {
    return report.status === "DUPLICATE" || report.status === "DECLINED" ? null : { status: "DECLINED" };
  }
  if (report.status === target && report.duplicateOfId === (duplicateOfId ?? report.duplicateOfId)) return null;
  return duplicateOfId ? { status: target, duplicateOfId } : { status: target };
};

export default async function reconcileIssueReportsWithGithub(req, logger, { gql, read = env, github } = {}) {
  const config = githubConfig(read);
  if (!config && !github) return { success: true, skipped: "The GitHub App is not configured" };
  const gh = github ?? createGithubClient(config);
  gql = gql ?? createHasuraClient();

  const reports = (await gql.request(LINKED, { limit: MAX_REPORTS })).IssueReport;
  const reportIdByIssue = new Map(reports.map((r) => [r.githubIssueNumber, r.id]));
  const counts = { checked: 0, updated: 0, unlinked: 0, failed: 0 };

  for (const report of reports) {
    try {
      const issue = await readIssue(gh, report.githubIssueNumber);
      const change = reportChange(report, issue, { hasBoard: !!gh.config.projectNumber, reportIdByIssue });
      if (change) {
        await gql.request(UPDATE, { id: report.id, set: change });
        if ("githubIssueNumber" in change) counts.unlinked += 1;
        else counts.updated += 1;
      }
      // Rewritten only when it differs, e.g. after a missed update on someone joining.
      if (issue) await updateFooter(gh, report.githubIssueNumber, renderFooter({ reportId: report.id, priority: report.priority, people: report.peopleAffected ?? 0 }));
      counts.checked += 1;
    } catch (error) {
      // Only the report id and GitHub's status: no report text.
      counts.failed += 1;
      logger.error("Reconciling an issue report with GitHub failed", { reportId: report.id, error: error.message });
    }
  }
  logger.info("Reconciled issue reports with GitHub", counts);
  return { success: counts.failed === 0, ...counts };
}
