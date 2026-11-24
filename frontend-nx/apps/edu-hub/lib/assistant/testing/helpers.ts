import type { NextApiRequest, NextApiResponse } from 'next';
import { readAssistantConfig } from '../config';
import type { ChatHandlerDeps, AssistantSession } from '../handler';
import { createRateLimiter } from '../limits';
import type { ChatProvider, ProviderRequest, ProviderTurn, ToolCall } from '../provider';
import { createMemorySpendTracker } from '../spending';
import type { ToolSet } from '../tools';

/** Test doubles for the Assistant's endpoints. */

export const mockHttp = (body: unknown, requestHeaders: Record<string, string> = {}, method = 'POST') => {
  const headers: Record<string, string> = {};
  const chunks: string[] = [];
  const listeners: Record<string, (() => void)[]> = {};
  const state = { status: 200, json: undefined as unknown, ended: false };
  const res = {
    get writableEnded() {
      return state.ended;
    },
    status(code: number) {
      state.status = code;
      return res;
    },
    json(value: unknown) {
      state.json = value;
      state.ended = true;
      return res;
    },

    setHeader(name: string, value: string) {
      headers[name.toLowerCase()] = value;
      return res;
    },
    writeHead(code: number, h: Record<string, string>) {
      state.status = code;
      Object.entries(h).forEach(([k, v]) => (headers[k.toLowerCase()] = v));
      return res;
    },
    write(chunk: string) {
      chunks.push(chunk);
      return true;
    },
    end() {
      state.ended = true;
      (listeners.close ?? []).forEach((l) => l());
      return res;
    },
    on(event: string, listener: () => void) {
      (listeners[event] ??= []).push(listener);
      return res;
    },
  };
  const req = { method, body, headers: requestHeaders, query: {} };
  return {
    req: req as unknown as NextApiRequest,
    res: res as unknown as NextApiResponse,
    get status() {
      return state.status;
    },
    get json() {
      return state.json as { error?: { code: string; message: string } };
    },
    headers,
    raw: () => chunks.join(''),
    events: () =>
      chunks
        .join('')
        .split('\n\n')
        .filter(Boolean)
        .map((block) => {
          const [, event] = block.match(/^event: (.*)$/m) ?? [];
          const [, data] = block.match(/^data: (.*)$/m) ?? [];
          return { event, data: JSON.parse(data) };
        }),
  };
};

export type Script = (request: ProviderRequest, round: number) => { text?: string; toolCalls?: ToolCall[] };

/** A provider that answers from a script and records what it was sent. */
export const scriptedProvider = (script: Script): ChatProvider & { requests: ProviderRequest[] } => {
  const requests: ProviderRequest[] = [];
  return {
    model: 'scripted',
    requests,
    async complete(request): Promise<ProviderTurn> {
      requests.push({ ...request, messages: [...request.messages] });
      const { text = '', toolCalls = [] } = script(request, requests.length - 1);
      if (text) request.onText(text);
      return { text, toolCalls, usage: { inputTokens: 1000, outputTokens: 100 } };
    },
  };
};

export const call = (name: string, args: unknown, id = `call_${name}`): ToolCall => ({
  id,
  name,
  arguments: typeof args === 'string' ? args : JSON.stringify(args),
});

export const session = (overrides: Partial<AssistantSession> = {}): AssistantSession => ({
  accessToken: 'alice-token',
  userId: 'alice',
  allowedRoles: ['user'],
  impersonating: false,
  ...overrides,
});

export const fakeConfig = (env: Record<string, string> = {}) =>
  readAssistantConfig((name) => ({ ASSISTANT_LLM_PROVIDER: 'fake', ...env }[name]));

export const testDeps = (
  overrides: Partial<Omit<ChatHandlerDeps, 'provider'>> & { tools?: ToolSet; provider?: ChatProvider } = {}
) => {
  const config = overrides.config ?? fakeConfig();
  const { tools, provider, ...rest } = overrides;
  const deps: ChatHandlerDeps = {
    config,
    getSession: async () => session(),
    provider: () => provider ?? scriptedProvider(() => ({ text: 'Hallo!' })),
    spend: createMemorySpendTracker(),
    rateLimiter: createRateLimiter(config.ok ? config.config.limits : { rateShortMax: 9, rateShortWindowMs: 1, rateDailyMax: 9 }),
    buildTools: async () => tools ?? { definitions: [], call: async () => ({ status: 'invalid', content: '{}' }) },
    contact: 'edu-support@opencampus.sh',
    ...rest,
  };
  return deps;
};

export interface FakeHasuraRegistration {
  userId: string;
  courseId: number;
  title: string;
  status: string;
}

/**
 * A fake Hasura for CourseEnrollment queries under the `user` role. Like the real permission set
 * (user_access + user_access_others) it lists every person's rows when the query has no user
 * filter, so only the Assistant's own pin keeps other people's data out.
 */
export const fakeHasura = (registrations: FakeHasuraRegistration[]) => {
  const requests: { headers: Record<string, string>; query: string; variables: any }[] = [];
  const matches = (where: any, row: FakeHasuraRegistration): boolean => {
    if (!where) return true;
    if (where._and) return where._and.every((w: any) => matches(w, row));
    if (where.userId?._eq !== undefined && row.userId !== where.userId._eq) return false;
    if (where.courseId?._eq !== undefined && row.courseId !== where.courseId._eq) return false;
    return true;
  };
  const fetchImpl = (async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    requests.push({ headers: init.headers as Record<string, string>, query: body.query, variables: body.variables });
    const rows = registrations.filter((r) => matches(body.variables.where, r));
    const data = {
      CourseEnrollment: rows.map((r) => ({
        status: r.status,
        created_at: '2026-10-01T10:00:00Z',
        invitationExpirationDate: null,
        achievementCertificateURL: null,
        attendanceCertificateURL: null,
        Course: { id: r.courseId, title: r.title, Program: { title: 'P' } },
      })),
      Attendance: [],
      Course: [],
    };
    return new Response(JSON.stringify({ data }), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as unknown as typeof fetch;
  return { fetchImpl, requests };
};
