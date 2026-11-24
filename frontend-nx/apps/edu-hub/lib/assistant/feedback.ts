import type { NextApiRequest, NextApiResponse } from 'next';
import type { ConfigResult } from './config';
import { AssistantSession, authenticate, refuse } from './handler';
import type { RateLimiter } from './limits';
import { toLocale } from './messages';
import { hasuraAsUser, OWN_DATA_ROLE } from './userTools';

/**
 * A 👍/👎 rating (issue #2193): POST `{ rating: 'up' | 'down', consent?, messages?, comment?,
 * route?, locale? }`. A rating alone is only counted (anonymous metric). A 👎 with `messages` stores
 * the conversation, and only with `consent: true`. Answers 204.
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

  const { rating } = body;
  if (rating !== 'up' && rating !== 'down') return refuse(res, 400, 'INVALID_REQUEST', locale);
  const store = rating === 'down' && body.messages !== undefined;
  // Never keep a conversation without consent, even if the widget sent one.
  if (store && body.consent !== true) return refuse(res, 400, 'FEEDBACK_CONSENT_REQUIRED', locale);

  const allowed = deps.rateLimiter.take(session.userId);
  if (allowed.ok === false) {
    res.setHeader('Retry-After', String(allowed.retryAfterSeconds));
    return refuse(res, 429, 'RATE_LIMITED_SHORT', locale, { minutes: Math.max(1, Math.ceil(allowed.retryAfterSeconds / 60)) });
  }
  if (!store) {
    console.info(JSON.stringify({ metric: 'assistant_feedback', event: 'rated', rating }));
    return res.status(204).end();
  }

  const input = Array.isArray(body.messages) ? body.messages : null;
  const valid =
    input &&
    input.length > 0 &&
    input.length <= limits.maxConversationMessages &&
    input.every((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string');
  if (!valid) return refuse(res, 400, 'INVALID_REQUEST', locale);
  // Only the text is kept: no Proposed Change ids or anything else the widget attaches.
  const messages = (input as { role: string; content: string }[]).map(({ role, content }) => ({ role, content }));
  // The Assistant's replies count too, so allow twice the conversation limit in total.
  const total = messages.reduce((sum, m) => sum + m.content.length, 0);
  if (total > 2 * limits.maxConversationChars) return refuse(res, 400, 'CONVERSATION_TOO_LONG', locale);

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
  console.info(JSON.stringify({ metric: 'assistant_feedback', event: 'stored', rating }));
  return res.status(204).end();
};
