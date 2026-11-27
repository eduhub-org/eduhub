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
 * Off (skipped) until the GitHub App is configured. Open reports go first, then closed ones,
 * starting at a different place each night; a run stops after TIME_BUDGET_MS, well inside
 * callNodeFunction's timeout, and the next night continues where the rotation lands.
 */

export const TIME_BUDGET_MS = 120_000;
const ISSUE_STATUSES = ["PLANNED", "IN_PROGRESS"];
const DAY_MS = 24 * 60 * 60 * 1000;

const LINKED = `
  query ReconcileLinkedIssueReports {
    IssueReport(where: { githubIssueNumber: { _is_null: false } }, order_by: { id: asc }) {
      id status priority duplicateOfId githubIssueNumber peopleAffected
    }
  }
`;

const UPDATE = `
  mutation ReconcileIssueReport($id: Int!, $set: IssueReport_set_input!) {
    update_IssueReport_by_pk(pk_columns: { id: $id }, _set: $set) { id }
  }
`;

/**
 * The order of one run: open reports (whose status GitHub may still change) first, then closed
 * ones rotated by the day, so a run cut short by the time budget doesn't check the same ones
 * every night.
 */
export const runOrder = (reports, now) => {
  const open = reports.filter((r) => ISSUE_STATUSES.includes(r.status));
  const closed = reports.filter((r) => !ISSUE_STATUSES.includes(r.status));
  const shift = closed.length ? Math.floor(now.getTime() / DAY_MS) % closed.length : 0;
  return [...open, ...closed.slice(shift), ...closed.slice(0, shift)];
};

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

export default async function reconcileIssueReportsWithGithub(req, logger, { gql, read = env, github, now = () => new Date() } = {}) {
  const config = githubConfig(read);
  if (!config && !github) return { success: true, skipped: "The GitHub App is not configured" };
  const gh = github ?? createGithubClient(config);
  gql = gql ?? createHasuraClient();

  const started = now().getTime();
  // All linked reports (one small row each), so a duplicate's original is always found.
  const reports = (await gql.request(LINKED)).IssueReport;
  const reportIdByIssue = new Map(reports.map((r) => [r.githubIssueNumber, r.id]));
  const counts = { checked: 0, updated: 0, unlinked: 0, failed: 0, left: 0 };

  const order = runOrder(reports, now());
  for (const [index, report] of order.entries()) {
    if (now().getTime() - started > TIME_BUDGET_MS) {
      counts.left = order.length - index;
      logger.warn("Reconciling issue reports stopped at the time budget", { left: counts.left });
      break;
    }
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
