import type { AssistantLimits } from './config';

/**
 * Per-user rate limit (issue #2193). Kept in memory per server instance, so no user ids are
 * stored anywhere; with several Cloud Run instances a user may get up to that many times the
 * limit, which is acceptable for a guard against runaway use (the spending cap is global).
 */
export const createRateLimiter = (limits: Pick<AssistantLimits, 'rateShortMax' | 'rateShortWindowMs' | 'rateDailyMax'>, now: () => number = Date.now) => {
  const DAY_MS = 24 * 60 * 60_000;
  const hits = new Map<string, number[]>();
  let lastSweep = now();

  const sweep = (t: number) => {
    if (t - lastSweep < 60_000) return;
    lastSweep = t;
    hits.forEach((times, key) => {
      const kept = times.filter((x) => t - x < DAY_MS);
      if (kept.length) hits.set(key, kept);
      else hits.delete(key);
    });
  };

  return {
    /** Counts one message; returns how long to wait when over a limit. */
    take(key: string): { ok: true } | { ok: false; retryAfterSeconds: number; window: 'short' | 'daily' } {
      const t = now();
      sweep(t);
      const times = (hits.get(key) ?? []).filter((x) => t - x < DAY_MS);
      const recent = times.filter((x) => t - x < limits.rateShortWindowMs);
      if (times.length >= limits.rateDailyMax) {
        hits.set(key, times);
        return { ok: false, window: 'daily', retryAfterSeconds: Math.ceil((times[0] + DAY_MS - t) / 1000) };
      }
      if (recent.length >= limits.rateShortMax) {
        hits.set(key, times);
        return { ok: false, window: 'short', retryAfterSeconds: Math.ceil((recent[0] + limits.rateShortWindowMs - t) / 1000) };
      }
      times.push(t);
      hits.set(key, times);
      return { ok: true };
    },
  };
};

export type RateLimiter = ReturnType<typeof createRateLimiter>;

export interface IncomingMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type ConversationCheck =
  | { ok: true; messages: IncomingMessage[] }
  | { ok: false; code: 'INVALID_REQUEST' | 'MESSAGE_TOO_LONG' | 'CONVERSATION_TOO_LONG' };

/**
 * Checks the conversation the browser sends (the server keeps none): only user and assistant
 * text, ending with a user message, within the message and conversation limits.
 */
export const checkConversation = (input: unknown, limits: AssistantLimits): ConversationCheck => {
  if (!Array.isArray(input) || input.length === 0) return { ok: false, code: 'INVALID_REQUEST' };
  const messages: IncomingMessage[] = [];
  for (const m of input) {
    if (!m || typeof m !== 'object') return { ok: false, code: 'INVALID_REQUEST' };
    const { role, content } = m as Record<string, unknown>;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return { ok: false, code: 'INVALID_REQUEST' };
    messages.push({ role, content });
  }
  const last = messages[messages.length - 1];
  if (last.role !== 'user' || !last.content.trim()) return { ok: false, code: 'INVALID_REQUEST' };
  if (messages.some((m) => m.role === 'user' && m.content.length > limits.maxMessageChars)) {
    return { ok: false, code: 'MESSAGE_TOO_LONG' };
  }
  const total = messages.reduce((sum, m) => sum + m.content.length, 0);
  if (messages.length > limits.maxConversationMessages || total > limits.maxConversationChars) {
    return { ok: false, code: 'CONVERSATION_TOO_LONG' };
  }
  return { ok: true, messages };
};
