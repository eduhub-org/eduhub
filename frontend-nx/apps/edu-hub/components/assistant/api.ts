/**
 * Client for the Assistant endpoints (#2193). The contract is written down in
 * `components/assistant/README.md`; keep both in sync.
 */

export const ASSISTANT_API_BASE = '/api/assistant';

export interface PageContext {
  /** The path the user is on, without query string. */
  path: string;
  /** The Next.js route pattern, e.g. `/course/[courseId]`. */
  route: string;
  courseId?: number;
  sessionId?: number;
  /** The error message shown on screen when the user asked, if any. */
  errorMessage?: string;
}

export type ProposalStatus = 'PROPOSED' | 'APPLIED' | 'DISCARDED' | 'FAILED';

/** A Proposed Change as the EduHub MCP server returns it (`ProposedChangeResult`). */
export interface ProposedChange {
  status: 'PROPOSED';
  proposedChangeId: string;
  kind: string;
  courseId: number | null;
  before: unknown;
  after: unknown;
  expiresAt: string;
  message?: string;
  /** Mail proposals: placeholders the draft drops, shown as a warning. */
  droppedPlaceholders?: string[];
}

/** A bug report, feature idea, vote or withdrawal the Assistant drafted (issue #2234); only the user's click sends it. */
export type ReportDraft =
  | { kind: 'create'; type: 'BUG' | 'FEATURE'; title: string; description: string }
  | { kind: 'vote'; reportId: number; type: 'BUG' | 'FEATURE'; summary: string }
  | { kind: 'withdraw'; reportId: number; summary: string };

export interface ChatMessagePayload {
  role: 'user' | 'assistant';
  content: string;
  proposals?: { proposedChangeId?: string; kind: string; courseId: number | null; status: ProposalStatus }[];
}

export interface ChatRequest {
  locale: string;
  messages: ChatMessagePayload[];
  pageContext: PageContext;
}

export interface AssistantError {
  code: string;
  message: string;
}

export type ChatEvent =
  | { type: 'delta'; text: string }
  | { type: 'proposal'; proposal: ProposedChange }
  | { type: 'report'; report: ReportDraft }
  | { type: 'tool'; name: string; status: 'running' | 'done' | 'failed' }
  | { type: 'error'; error: AssistantError }
  | { type: 'done' };

/** Turns one SSE block (`event: x\ndata: {...}`) into a ChatEvent; unknown events are ignored. */
const toChatEvent = (block: string): ChatEvent | null => {
  let name = 'message';
  const data: string[] = [];
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) name = line.slice(6).trim();
    else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
  }
  if (data.length === 0) return name === 'done' ? { type: 'done' } : null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(data.join('\n'));
  } catch {
    return null;
  }
  const body = parsed as Record<string, unknown>;
  switch (name) {
    case 'delta':
      return typeof body.text === 'string' ? { type: 'delta', text: body.text } : null;
    case 'proposal':
      return { type: 'proposal', proposal: body as unknown as ProposedChange };
    case 'report':
      return ['create', 'vote', 'withdraw'].includes(body.kind as string)
        ? { type: 'report', report: body as unknown as ReportDraft }
        : null;
    case 'tool':
      return typeof body.name === 'string' && ['running', 'done', 'failed'].includes(body.status as string)
        ? { type: 'tool', name: body.name, status: body.status as 'running' | 'done' | 'failed' }
        : null;
    case 'error':
      return { type: 'error', error: body as unknown as AssistantError };
    case 'done':
      return { type: 'done' };
    default:
      return null;
  }
};

/**
 * Splits buffered SSE text into complete events plus the unfinished rest, which
 * the caller keeps for the next chunk.
 */
export const parseSseBuffer = (buffer: string): { events: ChatEvent[]; rest: string } => {
  const blocks = buffer.replace(/\r\n/g, '\n').split('\n\n');
  const rest = blocks.pop() ?? '';
  const events = blocks.map(toChatEvent).filter((event): event is ChatEvent => event !== null);
  return { events, rest };
};

const jsonError = async (response: Response): Promise<AssistantError> => {
  try {
    const body = await response.json();
    if (body?.error?.code) return body.error as AssistantError;
  } catch {
    // not JSON; fall through
  }
  if (response.status === 401) return { code: 'NOT_LOGGED_IN', message: '' };
  if (response.status === 429) return { code: 'RATE_LIMITED_SHORT', message: '' };
  return { code: 'UNAVAILABLE', message: '' };
};

const headers = (role: string) => ({ 'Content-Type': 'application/json', 'x-hasura-role': role });

/** Sends the conversation and calls `onEvent` for every streamed event. Always ends with `done` or `error`. */
export const streamChat = async (
  request: ChatRequest,
  role: string,
  onEvent: (event: ChatEvent) => void,
  signal?: AbortSignal
): Promise<void> => {
  let response: Response;
  try {
    response = await fetch(`${ASSISTANT_API_BASE}/chat`, {
      method: 'POST',
      headers: { ...headers(role), Accept: 'text/event-stream' },
      body: JSON.stringify(request),
      signal,
    });
  } catch {
    if (signal?.aborted) return;
    onEvent({ type: 'error', error: { code: 'NETWORK', message: '' } });
    return;
  }
  if (!response.ok || !response.body) {
    onEvent({ type: 'error', error: await jsonError(response) });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finished = false;
  try {
    while (!finished) {
      const { value, done } = await reader.read();
      buffer += done ? decoder.decode() + '\n\n' : decoder.decode(value, { stream: true });
      const { events, rest } = parseSseBuffer(buffer);
      buffer = rest;
      for (const event of events) {
        onEvent(event);
        if (event.type === 'done' || event.type === 'error') finished = true;
      }
      if (done && !finished) {
        // The backend always ends with `done` or `error`; without one the reply was cut off.
        onEvent({ type: 'error', error: { code: 'INTERRUPTED', message: '' } });
        finished = true;
      }
    }
  } catch {
    if (!signal?.aborted) onEvent({ type: 'error', error: { code: 'NETWORK', message: '' } });
  } finally {
    if (!finished) reader.cancel().catch(() => undefined);
  }
};

export type ProposalDecision = 'apply' | 'discard';

export type ProposalOutcome = { ok: true; result: Record<string, unknown> } | { ok: false; error: AssistantError };

/** Applies or discards a Proposed Change. Only the Organizer's click calls this; the model never can. */
export const decideProposal = async (
  proposedChangeId: string,
  action: ProposalDecision,
  role: string,
  locale: string
): Promise<ProposalOutcome> => {
  try {
    const response = await fetch(`${ASSISTANT_API_BASE}/proposals`, {
      method: 'POST',
      headers: headers(role),
      body: JSON.stringify({ proposedChangeId, action, locale }),
    });
    if (!response.ok) return { ok: false, error: await jsonError(response) };
    return { ok: true, result: await response.json() };
  } catch {
    return { ok: false, error: { code: 'NETWORK', message: '' } };
  }
};

export interface FeedbackRequest {
  rating: 'up' | 'down';
  consent: boolean;
  /** Only sent for 👎 with the user's consent. */
  messages?: ChatMessagePayload[];
  /** The route pattern (e.g. `/course/[courseId]`), without IDs. */
  route?: string;
  /** What was wrong, in the user's words; sent for 👎 with or without the conversation. */
  comment?: string;
}

export const sendFeedback = async (feedback: FeedbackRequest, role: string): Promise<boolean> => {
  try {
    const response = await fetch(`${ASSISTANT_API_BASE}/feedback`, {
      method: 'POST',
      headers: headers(role),
      body: JSON.stringify(feedback),
    });
    return response.ok;
  } catch {
    return false;
  }
};

export type ReportOutcome = { ok: true; reportId: number } | { ok: false; error: AssistantError };

/** Sends a drafted report, vote or withdrawal. Only the user's click on the card calls this. */
export const sendReport = async (
  draft: ReportDraft,
  { role, locale, route }: { role: string; locale: string; route?: string }
): Promise<ReportOutcome> => {
  const body =
    draft.kind === 'create'
      ? { action: 'create', type: draft.type, title: draft.title, description: draft.description, route }
      : draft.kind === 'vote'
        ? { action: 'vote', reportId: draft.reportId, summary: draft.summary }
        : { action: 'withdraw', reportId: draft.reportId };
  try {
    const response = await fetch(`${ASSISTANT_API_BASE}/reports`, {
      method: 'POST',
      headers: headers(role),
      body: JSON.stringify({ ...body, locale }),
    });
    if (!response.ok) return { ok: false, error: await jsonError(response) };
    const result = await response.json();
    return { ok: true, reportId: Number(result?.reportId) };
  } catch {
    return { ok: false, error: { code: 'NETWORK', message: '' } };
  }
};
