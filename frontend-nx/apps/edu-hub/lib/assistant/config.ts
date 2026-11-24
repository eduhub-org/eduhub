/**
 * Configuration of the Assistant (issue #2193, ADR 0005), all from the environment, so moving to
 * another OpenAI-compatible provider is a configuration change only.
 *
 * ASSISTANT_LLM_PROVIDER selects the provider:
 * - "vertex": Gemini on Vertex AI's OpenAI-compatible API. The API key is the service account's
 *   access token from the Cloud Run metadata server (or ASSISTANT_LLM_API_KEY, e.g. a token from
 *   `gcloud auth print-access-token` for a local test).
 * - "openai": any other OpenAI-compatible endpoint with a static ASSISTANT_LLM_API_KEY
 *   (e.g. STACKIT or IONOS later).
 * - "fake": a deterministic provider for local development and tests; no credentials needed.
 * - unset or anything else: the Assistant is off.
 */

export type ProviderName = 'vertex' | 'openai' | 'fake';

export interface AssistantLimits {
  /** Messages per user in the short window. */
  rateShortMax: number;
  rateShortWindowMs: number;
  /** Messages per user per day. */
  rateDailyMax: number;
  maxMessageChars: number;
  maxConversationMessages: number;
  maxConversationChars: number;
  /** Model rounds (each may call tools) per reply. */
  maxToolRounds: number;
}

export interface AssistantConfig {
  provider: ProviderName;
  baseUrl: string;
  model: string;
  /** Static API key; for vertex only an override of the metadata-server token. */
  apiKey?: string;
  /** EUR per million tokens; the spending cap multiplies them with the tokens the API reports. */
  priceInputEurPerMtok: number;
  priceOutputEurPerMtok: number;
  monthlySpendCapEur: number;
  limits: AssistantLimits;
  /** Extra fields for the request body, e.g. {"reasoning_effort":"low"} (ASSISTANT_LLM_EXTRA_BODY). */
  extraBody: Record<string, unknown>;
}

export type ConfigResult = { ok: true; config: AssistantConfig } | { ok: false; reason: 'OFF' | 'MISCONFIGURED'; detail: string };

type Read = (name: string) => string | undefined;

const number = (read: Read, name: string, fallback: number) => {
  const raw = read(name);
  if (raw === undefined || raw.trim() === '') return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};

/**
 * Vertex's global endpoint gives no control over where requests are processed (ADR 0005), so a
 * base URL on it is refused: host aiplatform.googleapis.com or the location "global".
 */
export const isGlobalVertexEndpoint = (baseUrl: string) => {
  try {
    const url = new URL(baseUrl);
    return url.hostname === 'aiplatform.googleapis.com' || /\/locations\/global(\/|$)/.test(url.pathname);
  } catch {
    return false;
  }
};

export const readAssistantConfig = (read: Read = (name) => process.env[name]): ConfigResult => {
  const provider = (read('ASSISTANT_LLM_PROVIDER') || '').trim().toLowerCase();
  if (provider !== 'vertex' && provider !== 'openai' && provider !== 'fake') {
    return { ok: false, reason: 'OFF', detail: 'ASSISTANT_LLM_PROVIDER is not set' };
  }
  const baseUrl = (read('ASSISTANT_LLM_BASE_URL') || '').trim().replace(/\/+$/, '');
  const model = (read('ASSISTANT_LLM_MODEL') || '').trim();
  const apiKey = read('ASSISTANT_LLM_API_KEY')?.trim() || undefined;
  const priceInput = number(read, 'ASSISTANT_LLM_PRICE_INPUT_EUR_PER_MTOK', NaN);
  const priceOutput = number(read, 'ASSISTANT_LLM_PRICE_OUTPUT_EUR_PER_MTOK', NaN);

  if (provider !== 'fake') {
    if (!baseUrl || !model) return { ok: false, reason: 'MISCONFIGURED', detail: 'base URL or model missing' };
    if (isGlobalVertexEndpoint(baseUrl)) {
      return { ok: false, reason: 'MISCONFIGURED', detail: 'the global Vertex AI endpoint is not allowed' };
    }
    if (provider === 'openai' && !apiKey) return { ok: false, reason: 'MISCONFIGURED', detail: 'API key missing' };
    // Without prices the spending cap can't be measured, so a paid provider stays off.
    if (!Number.isFinite(priceInput) || !Number.isFinite(priceOutput)) {
      return { ok: false, reason: 'MISCONFIGURED', detail: 'token prices missing' };
    }
  }

  let extraBody: Record<string, unknown> = {};
  const rawExtra = read('ASSISTANT_LLM_EXTRA_BODY');
  if (rawExtra) {
    try {
      const parsed = JSON.parse(rawExtra);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) extraBody = parsed;
    } catch {
      return { ok: false, reason: 'MISCONFIGURED', detail: 'ASSISTANT_LLM_EXTRA_BODY is not JSON' };
    }
  }

  return {
    ok: true,
    config: {
      provider,
      baseUrl,
      model: model || 'fake',
      apiKey,
      priceInputEurPerMtok: Number.isFinite(priceInput) ? priceInput : 0,
      priceOutputEurPerMtok: Number.isFinite(priceOutput) ? priceOutput : 0,
      monthlySpendCapEur: number(read, 'ASSISTANT_MONTHLY_SPEND_CAP_EUR', 50),
      extraBody,
      limits: {
        rateShortMax: number(read, 'ASSISTANT_RATE_LIMIT_SHORT', 20),
        rateShortWindowMs: number(read, 'ASSISTANT_RATE_LIMIT_SHORT_MINUTES', 10) * 60_000,
        rateDailyMax: number(read, 'ASSISTANT_RATE_LIMIT_DAILY', 100),
        maxMessageChars: number(read, 'ASSISTANT_MAX_MESSAGE_CHARS', 4000),
        maxConversationMessages: number(read, 'ASSISTANT_MAX_CONVERSATION_MESSAGES', 40),
        maxConversationChars: number(read, 'ASSISTANT_MAX_CONVERSATION_CHARS', 60_000),
        maxToolRounds: number(read, 'ASSISTANT_MAX_TOOL_ROUNDS', 6),
      },
    },
  };
};
