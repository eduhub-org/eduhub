/**
 * Anonymous metrics of the Assistant (issue #2193): per request the outcome, the role group,
 * which tools ran how often, tokens, cost and duration. Never a user id, course id, message,
 * tool argument or tool result.
 *
 * Each request is logged as one JSON line (`{"metric":"assistant_chat",…}`) that a Cloud Logging
 * log-based metric can count, like the MCP server's `mcp_proposal` lines.
 */

export interface ChatMetric {
  metric: 'assistant_chat';
  /** `ok`, or the error code the user saw. */
  outcome: string;
  /** `participant` or `organizer`: whether course-setup tools were offered. */
  audience: 'participant' | 'organizer';
  provider: string;
  rounds: number;
  tools: Record<string, number>;
  invalidToolCalls: number;
  toolErrors: number;
  proposals: number;
  reports: number;
  inputTokens: number;
  outputTokens: number;
  costEur: number;
  durationMs: number;
}

export interface RejectedMetric {
  metric: 'assistant_rejected';
  /** Why the request was refused before reaching the model, e.g. RATE_LIMITED or SPENDING_CAP_REACHED. */
  reason: string;
}

export type AssistantMetric = ChatMetric | RejectedMetric;

type Listener = (metric: AssistantMetric) => void;
const listeners = new Set<Listener>();

export const onAssistantMetric = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const recordMetric = (metric: AssistantMetric) => {
  console.info(JSON.stringify(metric));
  listeners.forEach((listener) => listener(metric));
};
