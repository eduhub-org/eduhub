import type { NextApiRequest, NextApiResponse } from 'next';
import { runChat, ChatEvent } from './chat';
import type { ConfigResult } from './config';
import { COURSE_SETUP_ROLES } from './courseSetupTools';
import { checkConversation, RateLimiter } from './limits';
import { AssistantErrorCode, errorMessage, Locale, toLocale } from './messages';
import { recordMetric } from './metrics';
import { buildSystemPrompt, PageContext } from './prompt';
import type { ChatProvider } from './provider';
import { costEur, SpendTracker } from './spending';
import type { ToolSet } from './tools';

/**
 * The Assistant's chat endpoint (issue #2193): POST the conversation and the page context, get the
 * reply as Server-Sent Events. Login required; the server keeps no conversation.
 *
 * Request body: `{ messages: [{ role: 'user' | 'assistant', content, proposals? }], pageContext:
 * { path?, route?, courseId?, sessionId?, errorMessage? }, locale?: 'de' | 'en' }`, with the role in
 * use in the `x-hasura-role` header ('user', 'instructor', 'org_admin', 'admin'; default 'user').
 *
 * Refusals before the stream starts are JSON `{ error: { code, message } }` with status 400, 401,
 * 403, 429 (with Retry-After) or 503. The stream sends these events, each `data` being JSON:
 * - `delta` `{ text }`: a piece of the reply
 * - `tool` `{ name, status: 'running' | 'done' | 'failed' }`
 * - `proposal` the MCP server's ProposedChangeResult as-is: a Proposed Change for the widget to
 *   show with Apply/Discard buttons, which call /api/assistant/proposals themselves
 * - `report` a draft bug report, feature idea, vote or withdrawal (lib/assistant/reports.ts) for the
 *   widget to show as a card whose button calls /api/assistant/reports
 * - `error` `{ code, message }`
 * - `done` `{}`
 *
 * Nothing here logs prompts, replies, tool arguments or tool results: only anonymous metrics.
 */

export interface AssistantSession {
  accessToken: string;
  userId: string;
  allowedRoles: string[];
  /** An admin viewing the platform as someone else. */
  impersonating: boolean;
}

export interface ChatHandlerDeps {
  config: ConfigResult;
  getSession(req: NextApiRequest): Promise<AssistantSession | null>;
  provider(): ChatProvider;
  spend: SpendTracker;
  rateLimiter: RateLimiter;
  buildTools(session: AssistantSession, role: string): Promise<ToolSet & { close?(): Promise<void> }>;
  /** Named in the system prompt when the Assistant can't help (ASSISTANT_CONTACT); none if unset. */
  contact?: string;
}

const ASSISTANT_ROLES = ['user', ...COURSE_SETUP_ROLES];

const sanitizePage = (input: unknown): PageContext => {
  const page = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const id = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v > 0 ? v : undefined);
  const routeLike = (v: unknown) => (typeof v === 'string' && v.startsWith('/') ? v.slice(0, 300) : undefined);
  const error =
    typeof page.errorMessage === 'string' && page.errorMessage.trim() ? page.errorMessage.trim().slice(0, 500) : undefined;
  return { path: routeLike(page.path), route: routeLike(page.route), courseId: id(page.courseId), sessionId: id(page.sessionId), error };
};

/** The role in use, from the `x-hasura-role` header as for /api/mcp; `user` without one. */
export const requestedRole = (req: NextApiRequest) => {
  const header = req.headers?.['x-hasura-role'];
  const value = Array.isArray(header) ? header[0] : header;
  return typeof value === 'string' && value ? value : 'user';
};

export const refuse = (
  res: NextApiResponse,
  status: number,
  code: AssistantErrorCode,
  locale: Locale,
  params: Record<string, string | number> = {}
) => res.status(status).json({ error: { code, message: errorMessage(code, locale, params) } });

/** Resolves who is asking, or refuses. Shared by the chat and feedback endpoints. */
export const authenticate = async (
  req: NextApiRequest,
  res: NextApiResponse,
  getSession: ChatHandlerDeps['getSession'],
  locale: Locale
): Promise<AssistantSession | null> => {
  const session = await getSession(req);
  if (!session) {
    refuse(res, 401, 'NOT_LOGGED_IN', locale);
    return null;
  }
  if (session.impersonating) {
    refuse(res, 403, 'IMPERSONATING', locale);
    return null;
  }
  return session;
};

export const createChatHandler = (deps: ChatHandlerDeps) => async (req: NextApiRequest, res: NextApiResponse) => {
  const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
  const locale = toLocale(body.locale);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED' } });
  }
  if (!deps.config.ok) {
    if (deps.config.reason === 'MISCONFIGURED') console.error(`Assistant is misconfigured: ${deps.config.detail}`);
    recordMetric({ metric: 'assistant_rejected', reason: 'OFF' });
    return refuse(res, 503, 'OFF', locale);
  }
  const config = deps.config.config;

  const session = await authenticate(req, res, deps.getSession, locale);
  if (!session) return;

  const role = requestedRole(req);
  if (!ASSISTANT_ROLES.includes(role) || (role !== 'user' && !session.allowedRoles.includes(role))) {
    return refuse(res, 403, 'ROLE_NOT_ALLOWED', locale);
  }

  const conversation = checkConversation(body.messages, config.limits);
  if (conversation.ok === false) {
    recordMetric({ metric: 'assistant_rejected', reason: conversation.code });
    return refuse(res, 400, conversation.code, locale, { max: config.limits.maxMessageChars });
  }

  let spent: number;
  try {
    spent = await deps.spend.monthCostEur();
  } catch {
    // Without the month's total the cap can't be checked, so stay off rather than overspend.
    console.error('Assistant: reading the monthly spending failed');
    recordMetric({ metric: 'assistant_rejected', reason: 'SPENDING_UNKNOWN' });
    return refuse(res, 503, 'UNAVAILABLE', locale);
  }
  if (spent >= config.monthlySpendCapEur) {
    recordMetric({ metric: 'assistant_rejected', reason: 'SPENDING_CAP_REACHED' });
    return refuse(res, 503, 'SPENDING_CAP_REACHED', locale);
  }

  const allowed = deps.rateLimiter.take(session.userId);
  if (allowed.ok === false) {
    recordMetric({ metric: 'assistant_rejected', reason: 'RATE_LIMITED' });
    res.setHeader('Retry-After', String(allowed.retryAfterSeconds));
    return allowed.window === 'daily'
      ? refuse(res, 429, 'RATE_LIMITED_DAILY', locale)
      : refuse(res, 429, 'RATE_LIMITED_SHORT', locale, { minutes: Math.max(1, Math.ceil(allowed.retryAfterSeconds / 60)) });
  }

  const started = Date.now();
  const canSetUpCourses = COURSE_SETUP_ROLES.includes(role);
  const abort = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) abort.abort();
  });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    // Keeps Next's compression and proxies from buffering the stream.
    'Content-Encoding': 'none',
    'X-Accel-Buffering': 'no',
  });
  const send = (event: string, data: unknown) => {
    if (res.writableEnded || abort.signal.aborted) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    (res as unknown as { flush?: () => void }).flush?.();
  };
  const emit = (event: ChatEvent) => {
    if (event.type === 'text') send('delta', { text: event.delta });
    else if (event.type === 'tool') send('tool', { name: event.name, status: event.status });
    else if (event.type === 'proposal') send('proposal', event.proposal);
    else if (event.type === 'report') send('report', event.report);
    else send('error', { code: event.code, message: errorMessage(event.code, locale) });
  };

  let tools: (ToolSet & { close?(): Promise<void> }) | null = null;
  let outcome = 'ok';
  try {
    tools = await deps.buildTools(session, role);
    const summary = await runChat({
      provider: deps.provider(),
      tools,
      system: buildSystemPrompt({ role, page: sanitizePage(body.pageContext), canSetUpCourses, contact: deps.contact }),
      messages: conversation.messages,
      maxToolRounds: config.limits.maxToolRounds,
      emit,
      signal: abort.signal,
    });
    outcome = summary.outcome;
    const cost = costEur(summary.usage, { input: config.priceInputEurPerMtok, output: config.priceOutputEurPerMtok });
    try {
      await deps.spend.add({ ...summary.usage, costEur: cost });
    } catch {
      console.error('Assistant: recording the spending failed');
    }
    recordMetric({
      metric: 'assistant_chat',
      outcome,
      audience: canSetUpCourses ? 'organizer' : 'participant',
      provider: config.provider,
      rounds: summary.rounds,
      tools: summary.tools,
      invalidToolCalls: summary.invalidToolCalls,
      toolErrors: summary.toolErrors,
      proposals: summary.proposals,
      reports: summary.reports,
      inputTokens: summary.usage.inputTokens,
      outputTokens: summary.usage.outputTokens,
      costEur: Number(cost.toFixed(6)),
      durationMs: Date.now() - started,
    });
  } catch {
    // Only the fact, never the error's message: it could quote the conversation.
    console.error('Assistant: the chat request failed');
    emit({ type: 'error', code: 'UNAVAILABLE' });
  } finally {
    await tools?.close?.().catch(() => undefined);
    send('done', {});
    if (!res.writableEnded) res.end();
  }
};
