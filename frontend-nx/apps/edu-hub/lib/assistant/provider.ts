import type { AssistantConfig } from './config';
import { ApiKeySource, metadataServerToken, staticApiKey } from './credentials';

/**
 * The LLM behind the Assistant, spoken to through the OpenAI-compatible Chat Completions API
 * (ADR 0005): Vertex AI today, another provider later with only a configuration change.
 *
 * Zero retention: every request is sent with `store: false`, and no grounding or search tool is
 * ever requested. Nothing here logs request or response content; errors carry status codes only.
 */

export interface ToolCall {
  id: string;
  name: string;
  /** The raw JSON string the model produced; it may not parse. */
  arguments: string;
}

export type ChatMessage =
  | { role: 'system' | 'user'; content: string }
  | {
      role: 'assistant';
      content: string | null;
      tool_calls?: { id: string; type: 'function'; function: { name: string; arguments: string } }[];
    }
  | { role: 'tool'; tool_call_id: string; content: string };

export interface ToolDefinition {
  type: 'function';
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
}

export interface ProviderTurn {
  text: string;
  toolCalls: ToolCall[];
  usage: Usage;
}

export interface ProviderRequest {
  messages: ChatMessage[];
  tools: ToolDefinition[];
  /** Called with each piece of reply text as it streams in. */
  onText: (delta: string) => void;
  signal?: AbortSignal;
}

export interface ChatProvider {
  readonly model: string;
  complete(request: ProviderRequest): Promise<ProviderTurn>;
}

export type ProviderErrorCode = 'PROVIDER_UNAUTHORIZED' | 'PROVIDER_BUSY' | 'PROVIDER_ERROR' | 'PROVIDER_TIMEOUT';

export class ProviderError extends Error {
  constructor(public readonly code: ProviderErrorCode, public readonly status?: number) {
    super(status ? `${code} (HTTP ${status})` : code);
    this.name = 'ProviderError';
  }
}

const REQUEST_TIMEOUT_MS = 90_000;

/** Rough token estimate for providers that don't report usage (≈ 4 characters per token). */
export const estimateTokens = (text: string) => Math.ceil(text.length / 4);

const messagesText = (messages: ChatMessage[]) =>
  messages
    .map((m) =>
      m.role === 'assistant'
        ? `${m.content ?? ''}${(m.tool_calls ?? []).map((c) => c.function.arguments).join('')}`
        : m.content
    )
    .join('');

/** Parses an SSE byte stream of Chat Completions chunks into a turn. */
const readStream = async (
  body: ReadableStream<Uint8Array>,
  onText: (delta: string) => void
): Promise<{ text: string; toolCalls: ToolCall[]; usage: Usage | null }> => {
  const decoder = new TextDecoder();
  const reader = body.getReader();
  const calls: { id: string; name: string; arguments: string }[] = [];
  let text = '';
  let usage: Usage | null = null;
  let buffer = '';

  const handle = (data: string) => {
    if (data === '[DONE]') return;
    let chunk: any;
    try {
      chunk = JSON.parse(data);
    } catch {
      return;
    }
    if (chunk.usage) {
      usage = { inputTokens: chunk.usage.prompt_tokens ?? 0, outputTokens: chunk.usage.completion_tokens ?? 0 };
    }
    const delta = chunk.choices?.[0]?.delta;
    if (!delta) return;
    if (typeof delta.content === 'string' && delta.content) {
      text += delta.content;
      onText(delta.content);
    }
    for (const call of delta.tool_calls ?? []) {
      const index = typeof call.index === 'number' ? call.index : calls.length;
      const slot = (calls[index] ??= { id: '', name: '', arguments: '' });
      if (call.id) slot.id = call.id;
      if (call.function?.name) slot.name += call.function.name;
      if (call.function?.arguments) slot.arguments += call.function.arguments;
    }
  };

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newline: number;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line.startsWith('data:')) handle(line.slice(5).trim());
    }
  }
  if (buffer.trim().startsWith('data:')) handle(buffer.trim().slice(5).trim());

  const toolCalls = calls
    .filter(Boolean)
    .map((c, i) => ({ id: c.id || `call_${i}`, name: c.name, arguments: c.arguments || '{}' }));
  return { text, toolCalls, usage };
};

export const createOpenAiCompatibleProvider = (
  config: Pick<AssistantConfig, 'baseUrl' | 'model' | 'extraBody'>,
  apiKey: ApiKeySource,
  fetchImpl: typeof fetch = fetch
): ChatProvider => {
  const send = async (request: ProviderRequest, key: string) => {
    const signals = [AbortSignal.timeout(REQUEST_TIMEOUT_MS), ...(request.signal ? [request.signal] : [])];
    return fetchImpl(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        ...config.extraBody,
        model: config.model,
        messages: request.messages,
        ...(request.tools.length ? { tools: request.tools, tool_choice: 'auto' } : {}),
        stream: true,
        stream_options: { include_usage: true },
        // Zero retention (ADR 0005): nothing is stored on the provider's side.
        store: false,
      }),
      signal: AbortSignal.any(signals),
    });
  };

  return {
    model: config.model,
    async complete(request) {
      let response: Response;
      try {
        response = await send(request, await apiKey.get());
        if (response.status === 401) {
          // An expired token: fetch a new one and try once more.
          apiKey.invalidate();
          response = await send(request, await apiKey.get());
        }
      } catch (error) {
        if ((error as Error)?.name === 'TimeoutError') throw new ProviderError('PROVIDER_TIMEOUT');
        if ((error as Error)?.name === 'AbortError') throw error;
        throw new ProviderError('PROVIDER_ERROR');
      }
      if (!response.ok || !response.body) {
        // The body is not read: it may echo the request.
        if (response.status === 401 || response.status === 403) throw new ProviderError('PROVIDER_UNAUTHORIZED', response.status);
        if (response.status === 429) throw new ProviderError('PROVIDER_BUSY', response.status);
        throw new ProviderError('PROVIDER_ERROR', response.status);
      }
      const turn = await readStream(response.body, request.onText);
      return {
        text: turn.text,
        toolCalls: turn.toolCalls,
        usage: turn.usage ?? {
          inputTokens: estimateTokens(messagesText(request.messages)),
          outputTokens: estimateTokens(turn.text + turn.toolCalls.map((c) => c.arguments).join('')),
        },
      };
    },
  };
};

/**
 * A deterministic provider for local development and tests, so the stack runs without Google
 * credentials. It echoes, and a user message `/tool <name> <json>` makes it call that tool with
 * those arguments verbatim (also invalid JSON, to try the retry), then summarise the result.
 */
export const createFakeProvider = (): ChatProvider => ({
  model: 'fake',
  async complete({ messages, onText }) {
    const last = messages[messages.length - 1];
    let text: string;
    let toolCalls: ToolCall[] = [];
    if (last?.role === 'tool') {
      let first = messages.length;
      while (first > 0 && messages[first - 1].role === 'tool') first -= 1;
      text = `Fake Assistant: ${messages.length - first} tool result(s) received.`;
    } else {
      const content = last?.role === 'user' ? last.content : '';
      const command = content.match(/^\/tool\s+(\w+)\s*([\s\S]*)$/);
      if (command) {
        toolCalls = [{ id: `fake_${messages.length}`, name: command[1], arguments: command[2].trim() || '{}' }];
        text = '';
      } else {
        text = `Fake Assistant (no model configured). Your message had ${content.length} characters.`;
      }
    }
    for (const word of text.match(/\S+\s*/g) ?? []) onText(word);
    return {
      text,
      toolCalls,
      usage: { inputTokens: estimateTokens(messagesText(messages)), outputTokens: estimateTokens(text) },
    };
  },
});

export const createProvider = (config: AssistantConfig, fetchImpl: typeof fetch = fetch): ChatProvider => {
  if (config.provider === 'fake') return createFakeProvider();
  const key =
    config.apiKey !== undefined ? staticApiKey(config.apiKey) : metadataServerToken(fetchImpl);
  return createOpenAiCompatibleProvider(config, key, fetchImpl);
};
