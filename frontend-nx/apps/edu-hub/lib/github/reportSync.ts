import { GithubClient } from './client';
import {
  applyStatus,
  closeOrphan,
  CLOSED_STATUSES,
  createIssue,
  ISSUE_STATUSES,
  IssueState,
  placeOnBoard,
  readIssue,
  renderFooter,
  ReportStatus,
  ReportType,
  statusFromIssue,
  updateFooter,
  withFooter,
} from './issues';

/**
 * Keeps IssueReport rows and their GitHub issues in step (the design agreed on PR #2236's
 * follow-up):
 * - An admin approves a report (PLANNED or IN_PROGRESS) by creating its issue or linking an
 *   existing one; the issue text is what the admin confirmed in the dialog.
 * - Afterwards GitHub drives the status (syncFromGithub, from the webhook and the nightly
 *   reconcile); a status an admin sets in EduHub is written through to GitHub first.
 * - EduHub only keeps the footer current: report id, priority and people affected.
 */

export const REPORT_STATUSES: ReportStatus[] = ['NEW', 'PLANNED', 'IN_PROGRESS', 'DONE', 'DECLINED', 'DUPLICATE'];

export interface StoredReport {
  id: number;
  type: ReportType;
  status: ReportStatus;
  priority: string | null;
  duplicateOfId: number | null;
  githubIssueNumber: number | null;
  /** Votes on the report and on reports marked as its duplicates. */
  people: number;
}

/** IssueReport in Hasura, as an admin (the admin's token) or the server (admin secret). */
export interface ReportStore {
  get(id: number): Promise<StoredReport | null>;
  getByIssue(number: number): Promise<StoredReport | null>;
  update(id: number, set: { status?: ReportStatus; duplicateOfId?: number; githubIssueNumber?: number | null }): Promise<void>;
}

export type Request = <T>(query: string, variables: Record<string, unknown>) => Promise<T>;

const FIELDS = 'id type status priority duplicateOfId githubIssueNumber peopleAffected';

interface Row extends Omit<StoredReport, 'people'> {
  /** Computed field: votes on the report and on reports marked as its duplicates. */
  peopleAffected: number | null;
}

const toReport = (row: Row | null | undefined): StoredReport | null => {
  if (!row) return null;
  const { peopleAffected, ...rest } = row;
  return { ...rest, people: peopleAffected ?? 0 };
};

export const createReportStore = (request: Request): ReportStore => ({
  async get(id) {
    const data = await request<{ IssueReport_by_pk: Row | null }>(
      `query GithubSyncReport($id: Int!) { IssueReport_by_pk(id: $id) { ${FIELDS} } }`,
      { id }
    );
    return toReport(data.IssueReport_by_pk);
  },
  async getByIssue(number) {
    const data = await request<{ IssueReport: Row[] }>(
      `query GithubSyncReportByIssue($number: Int!) { IssueReport(where: { githubIssueNumber: { _eq: $number } }) { ${FIELDS} } }`,
      { number }
    );
    return toReport(data.IssueReport[0]);
  },
  async update(id, set) {
    await request(
      `mutation GithubSyncUpdateReport($id: Int!, $set: IssueReport_set_input!) {
        update_IssueReport_by_pk(pk_columns: { id: $id }, _set: $set) { id }
      }`,
      { id, set }
    );
  },
});

export type SyncErrorCode =
  | 'REPORT_NOT_FOUND'
  | 'ORIGINAL_NOT_FOUND'
  | 'ALREADY_LINKED'
  | 'ISSUE_REQUIRED'
  | 'ISSUE_NOT_FOUND'
  | 'ISSUE_TAKEN'
  | 'LINKED_CANNOT_BE_NEW'
  | 'INVALID_STATUS';

export class SyncError extends Error {
  constructor(public readonly code: SyncErrorCode, public readonly reportId?: number) {
    super(code);
    this.name = 'SyncError';
  }
}

const footerOf = (report: StoredReport) =>
  renderFooter({ reportId: report.id, priority: report.priority, people: report.people });

const requireReport = async (store: ReportStore, id: number) => {
  const report = await store.get(id);
  if (!report) throw new SyncError('REPORT_NOT_FOUND');
  return report;
};

const requireApproval = (status: ReportStatus) => {
  if (!ISSUE_STATUSES.includes(status)) throw new SyncError('INVALID_STATUS');
};

/** Approves a report by opening a new issue with the text the admin confirmed. */
export const createIssueForReport = async (
  gh: GithubClient,
  store: ReportStore,
  { reportId, status, title, description }: { reportId: number; status: ReportStatus; title: string; description: string }
) => {
  requireApproval(status);
  const report = await requireReport(store, reportId);
  if (report.githubIssueNumber) throw new SyncError('ALREADY_LINKED');
  const issue = await createIssue(gh, { type: report.type, title, body: withFooter(description, footerOf(report)) });
  try {
    await placeOnBoard(gh, { nodeId: issue.node_id, boardItem: null }, status);
  } catch (error) {
    // The issue exists either way; a missing board card is fixed by moving it by hand.
    console.error('GitHub sync: adding the issue to the board failed', { issue: issue.number, error: String(error) });
  }
  try {
    await store.update(reportId, { status, githubIssueNumber: issue.number });
  } catch (error) {
    // E.g. another admin linked the report meanwhile: close the public issue again instead of
    // leaving it orphaned, so a retry doesn't create a second one.
    await closeOrphan(gh, issue.node_id).catch(() =>
      console.error('GitHub sync: closing an unlinked new issue failed', { issue: issue.number })
    );
    throw error;
  }
  return issue.number;
};

/** Approves a report by linking an issue the team already has; it gets the footer appended. */
export const linkIssueToReport = async (
  gh: GithubClient,
  store: ReportStore,
  { reportId, status, issueNumber }: { reportId: number; status: ReportStatus; issueNumber: number }
) => {
  requireApproval(status);
  const report = await requireReport(store, reportId);
  if (report.githubIssueNumber) throw new SyncError('ALREADY_LINKED');
  const other = await store.getByIssue(issueNumber);
  if (other) throw new SyncError('ISSUE_TAKEN', other.id);
  const issue = await readIssue(gh, issueNumber);
  if (!issue) throw new SyncError('ISSUE_NOT_FOUND');
  await applyStatus(gh, issue, status);
  await updateFooter(gh, issueNumber, footerOf(report));
  await store.update(reportId, { status, githubIssueNumber: issueNumber });
  return issueNumber;
};

/**
 * A status set by an admin in EduHub. For a linked report GitHub is changed first, so a failure
 * leaves both sides as they were. Without an issue, PLANNED and IN_PROGRESS need the dialog.
 */
export const setReportStatus = async (
  gh: GithubClient | null,
  store: ReportStore,
  { reportId, status, duplicateOfId }: { reportId: number; status: ReportStatus; duplicateOfId?: number }
) => {
  if (!REPORT_STATUSES.includes(status)) throw new SyncError('INVALID_STATUS');
  // DUPLICATE always names its original (IssueReport_duplicate_has_original), and only DUPLICATE does.
  if ((status === 'DUPLICATE') !== !!duplicateOfId || duplicateOfId === reportId) throw new SyncError('INVALID_STATUS');
  const report = await requireReport(store, reportId);
  const original = duplicateOfId ? await store.get(duplicateOfId) : null;
  if (duplicateOfId && !original) throw new SyncError('ORIGINAL_NOT_FOUND');

  if (gh && report.githubIssueNumber) {
    if (status === 'NEW') throw new SyncError('LINKED_CANNOT_BE_NEW');
    const issue = await readIssue(gh, report.githubIssueNumber);
    if (issue) {
      const originalIssue = original?.githubIssueNumber ? await readIssue(gh, original.githubIssueNumber) : null;
      await applyStatus(gh, issue, status, originalIssue);
    }
  } else if (gh && ISSUE_STATUSES.includes(status)) {
    throw new SyncError('ISSUE_REQUIRED');
  }

  await store.update(reportId, duplicateOfId ? { status, duplicateOfId } : { status });
  // The original now counts this report's people too.
  if (gh && original) await refreshFooter(gh, store, original.id);
};

/** Rewrites the footer of a linked report's issue, e.g. after someone joined the report. */
export const refreshFooter = async (gh: GithubClient, store: ReportStore, reportId: number) => {
  const report = await store.get(reportId);
  if (!report?.githubIssueNumber) return;
  await updateFooter(gh, report.githubIssueNumber, footerOf(report));
};

/**
 * Brings the report linked to an issue in line with GitHub. Called for every webhook delivery
 * about the issue and by the nightly reconcile; harmless when nothing changed.
 * Returns what it did, for logs and tests.
 */
export const syncFromGithub = async (
  gh: GithubClient,
  store: ReportStore,
  issueNumber: number,
  known?: IssueState | null
): Promise<'none' | 'unlinked' | 'updated' | 'unchanged'> => {
  const report = await store.getByIssue(issueNumber);
  if (!report) return 'none';
  const issue = known === undefined ? await readIssue(gh, issueNumber) : known;
  const target = statusFromIssue(issue);
  if (!issue || !target) {
    // Deleted or moved away: keep the last status, drop the link.
    await store.update(report.id, { githubIssueNumber: null });
    return 'unlinked';
  }
  // Without a board GitHub can't tell PLANNED from IN_PROGRESS; EduHub's choice stands.
  if (!gh.config.projectNumber && ISSUE_STATUSES.includes(target) && ISSUE_STATUSES.includes(report.status))
    return 'unchanged';

  let duplicateOfId: number | undefined;
  if (target === 'DUPLICATE' && issue.duplicateOfNumber) {
    const original = await store.getByIssue(issue.duplicateOfNumber);
    if (original && original.id !== report.id) duplicateOfId = original.id;
  }
  if (target === 'DUPLICATE' && !duplicateOfId) {
    // DUPLICATE needs an original in EduHub. A link an admin set here is kept; otherwise (the
    // original issue has no report) it reads as declined: it won't be done as this report.
    if (report.status === 'DUPLICATE' || report.status === 'DECLINED') return 'unchanged';
    await store.update(report.id, { status: 'DECLINED' });
    return 'updated';
  }
  if (report.status === target && report.duplicateOfId === (duplicateOfId ?? report.duplicateOfId)) return 'unchanged';
  await store.update(report.id, duplicateOfId ? { status: target, duplicateOfId } : { status: target });
  if (duplicateOfId) await refreshFooter(gh, store, duplicateOfId);
  return 'updated';
};

export { CLOSED_STATUSES, ISSUE_STATUSES };
