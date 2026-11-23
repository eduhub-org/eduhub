/**
 * @jest-environment node
 */
import { createFeedbackHandler, FeedbackHandlerDeps } from './feedback';
import { createRateLimiter } from './limits';
import { fakeConfig, mockHttp, session } from './testing/helpers';

beforeEach(() => {
  jest.spyOn(console, 'info').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

const setup = (overrides: Partial<FeedbackHandlerDeps> = {}) => {
  const requests: { headers: Record<string, string>; body: any }[] = [];
  const fetchImpl = (async (_url: string, init: RequestInit) => {
    requests.push({ headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body)) });
    return new Response(JSON.stringify({ data: { insert_AssistantFeedback: { affected_rows: 1 } } }));
  }) as unknown as typeof fetch;
  const handler = createFeedbackHandler({
    config: fakeConfig(),
    getSession: async () => session(),
    rateLimiter: createRateLimiter({ rateShortMax: 10, rateShortWindowMs: 60_000, rateDailyMax: 30 }),
    hasuraUrl: 'http://h',
    contact: 'edu-support@opencampus.sh',
    fetchImpl,
    ...overrides,
  });
  return { handler, requests };
};

const conversation = [
  { role: 'user', content: 'Wann endet meine Einladung?' },
  { role: 'assistant', content: 'Morgen.' },
];

it('stores a 👎 conversation with the user\'s own token, under the user role, without a user id', async () => {
  const { handler, requests } = setup();
  const http = mockHttp({ consent: true, messages: conversation, comment: ' falsch ', route: '/course/3' });
  await handler(http.req, http.res);

  expect(http.status).toBe(201);
  expect(requests).toHaveLength(1);
  expect(requests[0].headers).toEqual(expect.objectContaining({ authorization: 'Bearer alice-token', 'x-hasura-role': 'user' }));
  expect(requests[0].body.variables.object).toEqual({ conversation, comment: 'falsch', route: '/course/3', model: 'fake' });
  expect(JSON.stringify(requests[0].body)).not.toContain('alice"');
});

it('stores nothing without consent', async () => {
  const { handler, requests } = setup();
  const http = mockHttp({ messages: conversation });
  await handler(http.req, http.res);
  expect(http.status).toBe(400);
  expect(http.json.error?.code).toBe('FEEDBACK_CONSENT_REQUIRED');
  expect(requests).toHaveLength(0);
});

it('requires login and refuses odd message shapes', async () => {
  const anonymous = setup({ getSession: async () => null });
  const a = mockHttp({ consent: true, messages: conversation });
  await anonymous.handler(a.req, a.res);
  expect(a.status).toBe(401);

  const { handler, requests } = setup();
  const b = mockHttp({ consent: true, messages: [{ role: 'user', content: 'x', userId: 'bob' }] });
  await handler(b.req, b.res);
  expect(b.status).toBe(400);
  expect(requests).toHaveLength(0);
});
