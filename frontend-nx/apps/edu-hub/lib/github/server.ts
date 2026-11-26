import type { NextApiRequest } from 'next';
import getRawBody from 'raw-body';
import { getAssistantSession, HASURA_URL } from '../assistant/server';
import { hasuraAsUser } from '../assistant/userTools';
import { createGithubClient, GithubClient, readGithubConfig } from './client';
import type { AdminHandlerDeps, WebhookDeps } from './handlers';
import { createReportStore, refreshFooter, Request } from './reportSync';

/** Production wiring of the GitHub report sync. One client per process, so its token is reused. */

let client: GithubClient | null | undefined;

export const githubClient = (): GithubClient | null => {
  if (client === undefined) {
    const config = readGithubConfig();
    client = config ? createGithubClient(config) : null;
  }
  return client;
};

const adminSecretRequest = (): Request | null => {
  const secret = process.env.HASURA_ADMIN_SECRET;
  if (!secret || !HASURA_URL) return null;
  return async <T>(query: string, variables: Record<string, unknown>) => {
    const response = await fetch(HASURA_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-hasura-admin-secret': secret },
      body: JSON.stringify({ query, variables }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.errors?.length || !body.data) throw new Error('HASURA_ERROR');
    return body.data as T;
  };
};

export const adminHandlerDeps: AdminHandlerDeps = {
  getSession: getAssistantSession,
  github: githubClient,
  // The admin's own token and role: Hasura logs and permissions see who changed what.
  store: (session) => createReportStore(hasuraAsUser({ url: HASURA_URL, token: session.accessToken, userId: '' }, 'admin')),
};

export const webhookDeps: WebhookDeps = {
  github: githubClient,
  store: () => {
    const request = adminSecretRequest();
    return request ? createReportStore(request) : null;
  },
  readRawBody: (req: NextApiRequest) => getRawBody(req, { limit: '1mb', encoding: 'utf8' }),
};

/**
 * After someone joined a report through the Assistant: the issue's "people affected" footer.
 * Best effort; the next join or the admin page corrects a miss.
 */
export const refreshReportFooter = async (reportId: number) => {
  const gh = githubClient();
  const request = adminSecretRequest();
  if (!gh || !request) return;
  try {
    await refreshFooter(gh, createReportStore(request), reportId);
  } catch (error) {
    console.error('GitHub sync: updating the footer failed', { reportId, error: String(error) });
  }
};
