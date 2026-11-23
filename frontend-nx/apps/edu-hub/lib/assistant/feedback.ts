import type { NextApiRequest, NextApiResponse } from 'next';
import type { ConfigResult } from './config';
import { AssistantSession, authenticate, refuse } from './handler';
import type { RateLimiter } from './limits';
import { toLocale } from './messages';
import { hasuraAsUser, OWN_DATA_ROLE } from './userTools';

/**
 * Stores a conversation rated 👎, only with the user's consent (issue #2193): POST
 * `{ consent: true, messages: [{ role, content }], comment?, route?, locale? }`.
 *
 * It is inserted with the user's own token under the `user` role (an insert-only permission) and
 * without any user id. Nobody but admins can read it, and a cron job deletes it after 30 days.
 */

const INSERT = `
  mutation AssistantInsertFeedback($object: AssistantFeedback_insert_input!) {
    insert_AssistantFeedback(objects: [$object]) { affected_rows }
  }
`;

const MAX_COMMENT_CHARS = 2000;

export interface FeedbackHandlerDeps {
  config: ConfigResult;
  getSession(req: NextApiRequest): Promise<AssistantSession | null>;
  rateLimiter: RateLimiter;
  hasuraUrl: string;
  contact: string;
  fetchImpl?: typeof fetch;
}

export const createFeedbackHandler = (deps: FeedbackHandlerDeps) => async (req: NextApiRequest, res: NextApiResponse) => {
  const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
  const locale = toLocale(body.locale);
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED' } });
  }
  if (!deps.config.ok) return refuse(res, 503, 'OFF', locale);
  const { limits, model } = deps.config.config;

  const session = await authenticate(req, res, deps.getSession, locale);
  if (!session) return;
  if (body.consent !== true) return refuse(res, 400, 'FEEDBACK_CONSENT_REQUIRED', locale);

  const messages = Array.isArray(body.messages) ? body.messages : null;
  const valid =
    messages &&
    messages.length > 0 &&
    messages.length <= limits.maxConversationMessages &&
    messages.every(
      (m) =>
        m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && Object.keys(m).length === 2
    );
  if (!valid) return refuse(res, 400, 'INVALID_REQUEST', locale);
  // The Assistant's replies count too, so allow twice the conversation limit in total.
  const total = (messages as { content: string }[]).reduce((sum, m) => sum + m.content.length, 0);
  if (total > 2 * limits.maxConversationChars) return refuse(res, 400, 'CONVERSATION_TOO_LONG', locale);

  const allowed = deps.rateLimiter.take(session.userId);
  if (allowed.ok === false) {
    res.setHeader('Retry-After', String(allowed.retryAfterSeconds));
    return refuse(res, 429, 'RATE_LIMITED_SHORT', locale, { minutes: Math.max(1, Math.ceil(allowed.retryAfterSeconds / 60)) });
  }

  const comment = typeof body.comment === 'string' && body.comment.trim() ? body.comment.trim().slice(0, MAX_COMMENT_CHARS) : null;
  const route = typeof body.route === 'string' && body.route.startsWith('/') ? body.route.slice(0, 300) : null;
  try {
    await hasuraAsUser({ url: deps.hasuraUrl, token: session.accessToken, userId: session.userId, fetchImpl: deps.fetchImpl }, OWN_DATA_ROLE)(
      INSERT,
      { object: { conversation: messages, comment, route, model } }
    );
  } catch {
    console.error('Assistant: storing feedback failed');
    return refuse(res, 503, 'UNAVAILABLE', locale, { contact: deps.contact });
  }
  console.info(JSON.stringify({ metric: 'assistant_feedback', event: 'stored' }));
  return res.status(201).json({ ok: true });
};
