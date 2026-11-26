import type { IssueReportList_IssueReport } from '../../../queries/__generated__/IssueReportList';

export const REPORT_TYPES = ['BUG', 'FEATURE'];
export const REPORT_STATUSES = ['NEW', 'PLANNED', 'IN_PROGRESS', 'DONE', 'DECLINED', 'DUPLICATE'];
export const OPEN_STATUSES = ['NEW', 'PLANNED', 'IN_PROGRESS'];
export const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'];

/** People affected: votes on the report and on reports marked as its duplicates. */
export const peopleAffected = (row: Pick<IssueReportList_IssueReport, 'Votes_aggregate' | 'Duplicates'>) =>
  (row.Votes_aggregate.aggregate?.count ?? 0) +
  row.Duplicates.reduce((sum, d) => sum + (d.Votes_aggregate.aggregate?.count ?? 0), 0);
