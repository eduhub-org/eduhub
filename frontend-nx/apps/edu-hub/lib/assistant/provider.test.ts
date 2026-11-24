/**
 * @jest-environment node
 */
import { isGlobalVertexEndpoint, readAssistantConfig } from './config';
import { metadataServerToken, staticApiKey } from './credentials';
import { createFakeProvider, createOpenAiCompatibleProvider, ProviderError } from './provider';

const sse = (chunks: unknown[]) =>
  new Response(chunks.map((c) => `data: ${typeof c === 'string' ? c : JSON.stringify(c)}\n\n`).join(''), {
    status: 200,
    headers: { 'content-type': 'text/event-stream' },
  });

const VERTEX_EU = 'https://aiplatform.eu.rep.googleapis.com/v1/projects/p/locations/eu/endpoints/openapi';

describe('configuration', () => {
  const env = (vars: Record<string, string>) => (name: string) => vars[name];
  const vertex = {
    ASSISTANT_LLM_PROVIDER: 'vertex',
    ASSISTANT_LLM_BASE_URL: VERTEX_EU,
    ASSISTANT_LLM_MODEL: 'google/gemini-3.8-flash',
    ASSISTANT_LLM_PRICE_INPUT_EUR_PER_MTOK: '0.3',
    ASSISTANT_LLM_PRICE_OUTPUT_EUR_PER_MTOK: '2.5',
  };

  it('is off without a provider', () => {
    expect(readAssistantConfig(env({}))).toEqual(expect.objectContaining({ ok: false, reason: 'OFF' }));
  });

  it('reads base URL, model and prices, so another provider is configuration only', () => {
    const result = readAssistantConfig(
      env({ ...vertex, ASSISTANT_LLM_PROVIDER: 'openai', ASSISTANT_LLM_BASE_URL: 'https://api.example.eu/v1/', ASSISTANT_LLM_API_KEY: 'k' })
    );
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        config: expect.objectContaining({ provider: 'openai', baseUrl: 'https://api.example.eu/v1', apiKey: 'k', model: 'google/gemini-3.8-flash' }),
      })
    );
  });

  it('refuses the global Vertex AI endpoint', () => {
    expect(isGlobalVertexEndpoint('https://aiplatform.googleapis.com/v1/projects/p/locations/global/endpoints/openapi')).toBe(true);
    expect(isGlobalVertexEndpoint('https://europe-west1-aiplatform.googleapis.com/v1/projects/p/locations/global/endpoints/openapi')).toBe(true);
    expect(isGlobalVertexEndpoint(VERTEX_EU)).toBe(false);
    expect(isGlobalVertexEndpoint('https://europe-west1-aiplatform.googleapis.com/v1/projects/p/locations/europe-west1/endpoints/openapi')).toBe(false);
    expect(
      readAssistantConfig(env({ ...vertex, ASSISTANT_LLM_BASE_URL: 'https://aiplatform.googleapis.com/v1/projects/p/locations/global/endpoints/openapi' }))
    ).toEqual(expect.objectContaining({ ok: false, reason: 'MISCONFIGURED' }));
  });

  it('stays off for a paid provider without prices, since the cap could not be measured', () => {
    const noPrice: Record<string, string> = { ...vertex };
    delete noPrice.ASSISTANT_LLM_PRICE_INPUT_EUR_PER_MTOK;
    expect(readAssistantConfig(env(noPrice))).toEqual(expect.objectContaining({ ok: false, reason: 'MISCONFIGURED' }));
  });
});

describe('OpenAI-compatible provider', () => {
  it('streams text and tool calls, sends store=false and no grounding, and reads usage', async () => {
    const sent: any[] = [];
    const fetchImpl = (async (url: string, init: RequestInit) => {
      sent.push({ url, headers: init.headers, body: JSON.parse(String(init.body)) });
      return sse([
        { choices: [{ delta: { content: 'Hal' } }] },
        { choices: [{ delta: { content: 'lo' } }] },
        { choices: [{ delta: { tool_calls: [{ index: 0, id: 'c1', function: { name: 'search_courses', arguments: '{"que' } }] } }] },
        { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: 'ry":"ML"}' } }] } }] },
        { choices: [], usage: { prompt_tokens: 120, completion_tokens: 30 } },
        '[DONE]',
      ]);
    }) as unknown as typeof fetch;
    const provider = createOpenAiCompatibleProvider({ baseUrl: VERTEX_EU, model: 'google/gemini-3.8-flash', extraBody: {} }, staticApiKey('tok'), fetchImpl);
    const deltas: string[] = [];

    const turn = await provider.complete({
      messages: [{ role: 'user', content: 'hi' }],
      tools: [{ type: 'function', function: { name: 'search_courses', description: '', parameters: {} } }],
      onText: (d) => deltas.push(d),
    });

    expect(deltas).toEqual(['Hal', 'lo']);
    expect(turn).toEqual({
      text: 'Hallo',
      toolCalls: [{ id: 'c1', name: 'search_courses', arguments: '{"query":"ML"}' }],
      usage: { inputTokens: 120, outputTokens: 30 },
    });
    expect(sent[0].url).toBe(`${VERTEX_EU}/chat/completions`);
    expect(sent[0].headers.authorization).toBe('Bearer tok');
    expect(sent[0].body).toEqual(expect.objectContaining({ model: 'google/gemini-3.8-flash', store: false, stream: true }));
    expect(JSON.stringify(sent[0].body)).not.toMatch(/grounding|google_search|googleSearch/i);
  });

  it("keeps a tool call's extra_content (Gemini's thought_signature) and nothing else", async () => {
    const signature = { google: { thought_signature: 'sig==' } };
    const fetchImpl = (async () =>
      sse([
        { choices: [{ delta: { tool_calls: [{ index: 0, id: 'c1', extra_content: signature, function: { name: 'get_weather', arguments: '{}' } }] } }] },
        { choices: [{ delta: { tool_calls: [{ index: 1, id: 'c2', function: { name: 'get_weather', arguments: '{}' } }] } }] },
        '[DONE]',
      ])) as unknown as typeof fetch;
    const provider = createOpenAiCompatibleProvider({ baseUrl: VERTEX_EU, model: 'm', extraBody: {} }, staticApiKey('tok'), fetchImpl);

    const turn = await provider.complete({ messages: [{ role: 'user', content: 'hi' }], tools: [], onText: () => undefined });

    expect(turn.toolCalls).toEqual([
      { id: 'c1', name: 'get_weather', arguments: '{}', extraContent: signature },
      { id: 'c2', name: 'get_weather', arguments: '{}' },
    ]);
  });

  it('joins a call that Gemini spreads over several indices under one id', async () => {
    // As sent with extra_body.google.stream_function_call_arguments: the signature on the first
    // piece, the arguments on later ones, the name repeated on each.
    const signature = { google: { thought_signature: 'sig==' } };
    const piece = (index: number, id: string, name: string, args: string, extra?: unknown) => ({
      choices: [{ delta: { tool_calls: [{ index, id, ...(extra ? { extra_content: extra } : {}), function: { name, arguments: args } }] } }],
    });
    const fetchImpl = (async () =>
      sse([
        piece(0, 'A', 'save_text', '', signature),
        piece(1, 'A', 'save_text', '{"text":'),
        piece(2, 'A', 'save_text', '"Hallo"}'),
        piece(3, 'B', 'get_weather', '{"city":"Kiel"}'),
        '[DONE]',
      ])) as unknown as typeof fetch;
    const provider = createOpenAiCompatibleProvider({ baseUrl: VERTEX_EU, model: 'm', extraBody: {} }, staticApiKey('tok'), fetchImpl);

    const turn = await provider.complete({ messages: [{ role: 'user', content: 'hi' }], tools: [], onText: () => undefined });

    expect(turn.toolCalls).toEqual([
      { id: 'A', name: 'save_text', arguments: '{"text":"Hallo"}', extraContent: signature },
      { id: 'B', name: 'get_weather', arguments: '{"city":"Kiel"}' },
    ]);
  });

  it('refreshes an expired token once on 401', async () => {
    let calls = 0;
    const keys = ['old', 'new'];
    const source = { get: async () => keys[0], invalidate: () => keys.shift() };
    const fetchImpl = (async (_url: string, init: RequestInit) => {
      calls += 1;
      return (init.headers as Record<string, string>).authorization === 'Bearer old'
        ? new Response('', { status: 401 })
        : sse([{ choices: [{ delta: { content: 'ok' } }] }]);
    }) as unknown as typeof fetch;
    const provider = createOpenAiCompatibleProvider({ baseUrl: 'https://x', model: 'm', extraBody: {} }, source, fetchImpl);
    const turn = await provider.complete({ messages: [], tools: [], onText: () => undefined });
    expect(turn.text).toBe('ok');
    expect(calls).toBe(2);
  });

  it('turns HTTP errors into codes without reading the body', async () => {
    const provider = (status: number) =>
      createOpenAiCompatibleProvider(
        { baseUrl: 'https://x', model: 'm', extraBody: {} },
        staticApiKey('k'),
        (async () => new Response('echo of the prompt', { status })) as unknown as typeof fetch
      );
    await expect(provider(429).complete({ messages: [], tools: [], onText: () => undefined })).rejects.toEqual(new ProviderError('PROVIDER_BUSY', 429));
    await expect(provider(500).complete({ messages: [], tools: [], onText: () => undefined })).rejects.toEqual(new ProviderError('PROVIDER_ERROR', 500));
  });
});

describe('Vertex AI token from the metadata server', () => {
  it('is cached and fetched again five minutes before it expires', async () => {
    let now = 0;
    let issued = 0;
    const fetchImpl = (async (url: string, init: RequestInit) => {
      expect(url).toContain('metadata.google.internal');
      expect((init.headers as Record<string, string>)['Metadata-Flavor']).toBe('Google');
      issued += 1;
      return new Response(JSON.stringify({ access_token: `t${issued}`, expires_in: 3600 }));
    }) as unknown as typeof fetch;
    const source = metadataServerToken(fetchImpl, () => now);

    expect(await source.get()).toBe('t1');
    now = 54 * 60_000;
    expect(await source.get()).toBe('t1');
    now = 56 * 60_000;
    expect(await source.get()).toBe('t2');
    source.invalidate();
    expect(await source.get()).toBe('t3');
  });
});

describe('fake provider', () => {
  it('echoes, and calls a tool on /tool', async () => {
    const provider = createFakeProvider();
    const echo = await provider.complete({ messages: [{ role: 'user', content: 'Hallo' }], tools: [], onText: () => undefined });
    expect(echo.text).toContain('Fake Assistant');
    const tool = await provider.complete({ messages: [{ role: 'user', content: '/tool search_courses {"query":"ML"}' }], tools: [], onText: () => undefined });
    expect(tool.toolCalls).toEqual([expect.objectContaining({ name: 'search_courses', arguments: '{"query":"ML"}' })]);
  });
});
