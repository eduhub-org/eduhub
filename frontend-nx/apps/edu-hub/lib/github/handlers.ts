import { createHmac, timingSafeEqual } from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { GithubClient, GithubError } from './client';
import { issueNumberOfNode, issueUrl, ReportStatus } from './issues';
import {
  createIssueForReport,
  linkIssueToReport,
  REPORT_STATUSES,
  ReportStore,
  setReportStatus,
  SyncError,
  syncFromGithub,
} from './reportSync';

/** Who is asking, from the NextAuth session (lib/assistant/server.ts getAssistantSession). */
export interface AdminSession {
  accessToken: string;
  allowedRoles: string[];
  impersonating: boolean;
}

export interface AdminHandlerDeps {
  getSession(req: NextApiRequest): Promise<AdminSession | null>;
  /** Null while the GitHub App is not configured: status changes still work, without GitHub. */
  github(): GithubClient | null;
  /** IssueReport as this admin, with their own token and the admin role. */
  store(session: AdminSession): ReportStore;
}

const positiveInt = (value: unknown) => (typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null);
const text = (value: unknown, max: number) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= max ? trimmed : null;
};
const status = (value: unknown) => (REPORT_STATUSES.includes(value as ReportStatus) ? (value as ReportStatus) : null);

/** GitHub's own limits are far higher; these match IssueReport's. */
const LIMITS = { title: 200, description: 4000 };

/**
 * /api/manage/reports/github, admins only.
 * GET: `{ enabled, repo }`.
 * POST `{ action: 'create', reportId, status, title, description }`,
 * `{ action: 'link', reportId, status, issueNumber }` or
 * `{ action: 'status', reportId, status, duplicateOfId? }`.
 * Answers `{ ok: true, issueNumber?, issueUrl? }` or `{ error: { code, reportId? } }`.
 */
export const createAdminHandler = (deps: AdminHandlerDeps) => async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await deps.getSession(req);
  if (!session) return res.status(401).json({ error: { code: 'NOT_LOGGED_IN' } });
  if (session.impersonating || !session.allowedRoles.includes('admin'))
    return res.status(403).json({ error: { code: 'NOT_ADMIN' } });

  const gh = deps.github();
  if (req.method === 'GET')
    return res.status(200).json({ enabled: !!gh, repo: gh ? `${gh.config.owner}/${gh.config.repo}` : null });
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED' } });
  }

  const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
  const reportId = positiveInt(body.reportId);
  const newStatus = status(body.status);
  if (!reportId || !newStatus) return res.status(400).json({ error: { code: 'INVALID_REQUEST' } });
  const store = deps.store(session);

  try {
    if (body.action === 'status') {
      const duplicateOfId = body.duplicateOfId === undefined || body.duplicateOfId === null ? undefined : positiveInt(body.duplicateOfId);
      if (duplicateOfId === null) return res.status(400).json({ error: { code: 'INVALID_REQUEST' } });
      await setReportStatus(gh, store, { reportId, status: newStatus, duplicateOfId });
      return res.status(200).json({ ok: true });
    }
    if (!gh) return res.status(409).json({ error: { code: 'GITHUB_OFF' } });
    if (body.action === 'create') {
      const title = text(body.title, LIMITS.title);
      const description = text(body.description, LIMITS.description);
      if (!title || !description) return res.status(400).json({ error: { code: 'INVALID_REQUEST' } });
      const issueNumber = await createIssueForReport(gh, store, { reportId, status: newStatus, title, description });
      console.info(JSON.stringify({ metric: 'github_report_sync', event: 'issue_created' }));
      return res.status(200).json({ ok: true, issueNumber, issueUrl: issueUrl(gh, issueNumber) });
    }
    if (body.action === 'link') {
      const issueNumber = positiveInt(body.issueNumber);
      if (!issueNumber) return res.status(400).json({ error: { code: 'INVALID_REQUEST' } });
      await linkIssueToReport(gh, store, { reportId, status: newStatus, issueNumber });
      console.info(JSON.stringify({ metric: 'github_report_sync', event: 'issue_linked' }));
      return res.status(200).json({ ok: true, issueNumber, issueUrl: issueUrl(gh, issueNumber) });
    }
    return res.status(400).json({ error: { code: 'INVALID_REQUEST' } });
  } catch (error) {
    if (error instanceof SyncError) return res.status(409).json({ error: { code: error.code, reportId: error.reportId } });
    // Status and GitHub's message only: no report text.
    console.error('GitHub sync: admin action failed', { action: String(body.action), error: error instanceof GithubError ? error.message : 'HASURA_OR_NETWORK' });
    return res.status(502).json({ error: { code: error instanceof GithubError ? 'GITHUB_FAILED' : 'FAILED' } });
  }
};

// --- Webhook -----------------------------------------------------------------------------------

/** GitHub's `X-Hub-Signature-256`: HMAC-SHA256 of the raw body, compared in constant time. */
export const validSignature = (secret: string, rawBody: string, header: string | string[] | undefined) => {
  const value = Array.isArray(header) ? header[0] : header;
  if (!value?.startsWith('sha256=')) return false;
  const expected = new Uint8Array(Buffer.from(`sha256=${createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')}`));
  const given = new Uint8Array(Buffer.from(value));
  return expected.length === given.length && timingSafeEqual(expected, given);
};

export interface WebhookDeps {
  github(): GithubClient | null;
  /** IssueReport with the admin secret: GitHub is not a user. */
  store(): ReportStore | null;
  readRawBody(req: NextApiRequest): Promise<string>;
}

/**
 * /api/webhooks/github, called by the GitHub App for `issues` and `projects_v2_item` events.
 * The payload only says which issue changed; its state is read back from GitHub
 * (syncFromGithub), so a forged or stale payload can at most trigger a harmless re-read.
 */
export const createWebhookHandler = (deps: WebhookDeps) => async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const gh = deps.github();
  const store = deps.store();
  if (!gh || !store) return res.status(503).json({ error: 'GitHub sync is not configured' });

  const rawBody = await deps.readRawBody(req);
  if (!validSignature(gh.config.webhookSecret, rawBody, req.headers['x-hub-signature-256']))
    return res.status(401).json({ error: 'Invalid signature' });

  let payload: Record<string, any>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  const event = String(req.headers['x-github-event'] ?? '');

  try {
    let issueNumber: number | null = null;
    if (event === 'issues') {
      const repo = String(payload.repository?.full_name ?? '').toLowerCase();
      if (repo === `${gh.config.owner}/${gh.config.repo}`.toLowerCase() && Number.isInteger(payload.issue?.number))
        issueNumber = payload.issue.number;
    } else if (event === 'projects_v2_item') {
      const item = payload.projects_v2_item;
      if (item?.content_type === 'Issue' && typeof item.content_node_id === 'string')
        issueNumber = await issueNumberOfNode(gh, item.content_node_id);
    }
    if (!issueNumber) return res.status(200).json({ ok: true, ignored: event || 'unknown' });
    const result = await syncFromGithub(gh, store, issueNumber);
    if (result !== 'none') console.info(JSON.stringify({ metric: 'github_report_sync', event: `webhook_${result}` }));
    return res.status(200).json({ ok: true, result });
  } catch (error) {
    // GitHub shows the failed delivery; the nightly reconcile catches up.
    console.error('GitHub sync: webhook failed', { event, error: error instanceof GithubError ? error.message : 'HASURA_OR_NETWORK' });
    return res.status(502).json({ error: 'Sync failed' });
  }
};
