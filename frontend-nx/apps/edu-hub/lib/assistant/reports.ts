import type { NextApiRequest, NextApiResponse } from 'next';
import { AssistantSession, authenticate, refuse, requestedRole } from './handler';
import { AssistantErrorCode, toLocale } from './messages';
import { hasuraAsUser, HasuraRequestError, OWN_DATA_ROLE } from './userTools';

/**
 * Bug reports and feature ideas through the Assistant (issue #2234).
 *
 * The model only drafts (`ReportDraft`, streamed to the widget as a `report` event); only the
 * user's click on the card saves, through POST /api/assistant/reports. Saving runs with the user's
 * own token under the `user` role, so Hasura's permissions decide what a person may insert, vote
 * on or withdraw (backend/metadata/.../public_IssueReport.yaml).
 *
 * Users never see another person's report text: when the Assistant finds a matching open report,
 * it writes its own short summary, and that summary is what the voter sees and keeps.
 */

export const REPORT_TYPES = ['BUG', 'FEATURE'] as const;
export type ReportType = (typeof REPORT_TYPES)[number];
export const OPEN_STATUSES = ['NEW', 'PLANNED', 'IN_PROGRESS'];

export const REPORT_LIMITS = {
  title: 200,
  description: 4000,
  summary: 500,
  /** New reports per person in 24 hours; votes don't count. */
  perDay: 5,
};

export type ReportDraft =
  | { kind: 'create'; type: ReportType; title: string; description: string }
  | { kind: 'vote'; reportId: number; type: ReportType; summary: string }
  | { kind: 'withdraw'; reportId: number; summary: string };

const COUNT_TODAY = `
  query AssistantReportsToday($userId: uuid!, $since: timestamptz!) {
    IssueReportVote_aggregate(
      where: { userId: { _eq: $userId }, isReporter: { _eq: true }, created_at: { _gte: $since } }
    ) { aggregate { count } }
  }
`;

const CREATE = `
  mutation AssistantCreateReport($object: IssueReport_insert_input!) {
    insert_IssueReport_one(object: $object) { id status }
  }
`;

const VOTE = `
  mutation AssistantVoteReport($object: IssueReportVote_insert_input!) {
    insert_IssueReportVote_one(object: $object) { id issueReportId }
  }
`;

const WITHDRAW = `
  mutation AssistantWithdrawReport($id: Int!) {
    delete_IssueReport(where: { id: { _eq: $id } }) { affected_rows }
  }
`;

const text = (value: unknown, max: number) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= max ? trimmed : null;
};

const positiveInt = (value: unknown) =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;

/** Hasura's error code for a unique or check violation, which the generic client hides. */
const constraintError = async (run: () => Promise<unknown>): Promise<'UNIQUE' | 'CHECK' | null> => {
  try {
    await run();
    return null;
  } catch (error) {
    if (!(error instanceof HasuraRequestError)) throw error;
    const code = error.hasuraCode;
    // A unique violation means one vote per person; a missing report (foreign key) counts as closed.
    if (code === 'constraint-violation') return /uniqueness/i.test(error.hasuraMessage ?? '') ? 'UNIQUE' : 'CHECK';
    if (code === 'permission-error') return 'CHECK';
    throw error;
  }
};

export interface ReportsHandlerDeps {
  getSession(req: NextApiRequest): Promise<AssistantSession | null>;
  hasuraUrl: string;
  contact: string;
  fetchImpl?: typeof fetch;
  now?: () => Date;
}

/**
 * POST `{ action: 'create', type, title, description, route?, locale? }`,
 * `{ action: 'vote', reportId, summary }` or `{ action: 'withdraw', reportId }`.
 * Answers 200 `{ reportId }`, or `{ error: { code, message } }`.
 */
export const createReportsHandler = (deps: ReportsHandlerDeps) => async (req: NextApiRequest, res: NextApiResponse) => {
  const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
  const locale = toLocale(body.locale);
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED' } });
  }
  const session = await authenticate(req, res, deps.getSession, locale);
  if (!session) return;

  const request = hasuraAsUser(
    { url: deps.hasuraUrl, token: session.accessToken, userId: session.userId, fetchImpl: deps.fetchImpl },
    OWN_DATA_ROLE
  );
  const fail = (status: number, code: AssistantErrorCode) =>
    refuse(res, status, code, locale, { contact: deps.contact, max: REPORT_LIMITS.perDay });
  const now = deps.now ?? (() => new Date());

  try {
    if (body.action === 'create') {
      const type = REPORT_TYPES.includes(body.type as ReportType) ? (body.type as ReportType) : null;
      const title = text(body.title, REPORT_LIMITS.title);
      const description = text(body.description, REPORT_LIMITS.description);
      if (!type || !title || !description) return fail(400, 'INVALID_REQUEST');
      const route = typeof body.route === 'string' && body.route.startsWith('/') ? body.route.slice(0, 300) : null;
      const role = requestedRole(req).slice(0, 50);

      const since = new Date(now().getTime() - 24 * 60 * 60_000).toISOString();
      const today = await request<{ IssueReportVote_aggregate: { aggregate: { count: number } } }>(COUNT_TODAY, {
        userId: session.userId,
        since,
      });
      if (today.IssueReportVote_aggregate.aggregate.count >= REPORT_LIMITS.perDay)
        return fail(429, 'REPORT_LIMIT_REACHED');

      const data = await request<{ insert_IssueReport_one: { id: number } }>(CREATE, {
        object: { type, title, description, route, role, locale, Votes: { data: [{ summary: title }] } },
      });
      console.info(JSON.stringify({ metric: 'assistant_report', event: 'created', type }));
      return res.status(200).json({ reportId: data.insert_IssueReport_one.id });
    }

    if (body.action === 'vote') {
      const reportId = positiveInt(body.reportId);
      const summary = text(body.summary, REPORT_LIMITS.summary);
      if (!reportId || !summary) return fail(400, 'INVALID_REQUEST');
      const refused = await constraintError(() => request(VOTE, { object: { issueReportId: reportId, summary } }));
      if (refused === 'UNIQUE') return fail(409, 'REPORT_ALREADY_VOTED');
      if (refused === 'CHECK') return fail(409, 'REPORT_CLOSED');
      console.info(JSON.stringify({ metric: 'assistant_report', event: 'voted' }));
      return res.status(200).json({ reportId });
    }

    if (body.action === 'withdraw') {
      const reportId = positiveInt(body.reportId);
      if (!reportId) return fail(400, 'INVALID_REQUEST');
      const data = await request<{ delete_IssueReport: { affected_rows: number } }>(WITHDRAW, { id: reportId });
      if (data.delete_IssueReport.affected_rows === 0) return fail(409, 'REPORT_NOT_WITHDRAWABLE');
      console.info(JSON.stringify({ metric: 'assistant_report', event: 'withdrawn' }));
      return res.status(200).json({ reportId });
    }

    return fail(400, 'INVALID_REQUEST');
  } catch (error) {
    // Only the fact: the error could quote the report.
    console.error('Assistant: saving a report failed');
    if (error instanceof HasuraRequestError && error.code === 'UNAUTHENTICATED') return fail(401, 'NOT_LOGGED_IN');
    return fail(503, 'REPORT_FAILED');
  }
};
