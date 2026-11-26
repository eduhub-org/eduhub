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
  { role: 'assistant', content: 'Morgen.', proposals: [{ proposedChangeId: 'v1.secret', kind: 'course_texts', status: 'DISCARDED' }] },
];

it('stores a 👎 conversation with consent, with the user\'s own token, under the user role, without a user id', async () => {
  const { handler, requests } = setup();
  const http = mockHttp({ rating: 'down', consent: true, messages: conversation, comment: ' falsch ', route: '/course/3' });
  await handler(http.req, http.res);

  expect(http.status).toBe(204);
  expect(requests).toHaveLength(1);
  expect(requests[0].headers).toEqual(expect.objectContaining({ authorization: 'Bearer alice-token', 'x-hasura-role': 'user' }));
  expect(requests[0].body.variables.object).toEqual({
    conversation: [
      { role: 'user', content: 'Wann endet meine Einladung?' },
      { role: 'assistant', content: 'Morgen.' },
    ],
    comment: 'falsch',
    route: '/course/3',
    model: 'fake',
  });
  expect(JSON.stringify(requests[0].body)).not.toMatch(/alice"|v1\.secret/);
});

it('only counts a rating without a conversation', async () => {
  const { handler, requests } = setup();
  for (const body of [{ rating: 'up' }, { rating: 'down', consent: false }]) {
    const http = mockHttp(body);
    await handler(http.req, http.res);
    expect(http.status).toBe(204);
  }
  expect(requests).toHaveLength(0);
});

it('stores nothing without consent, even when the conversation is sent', async () => {
  const { handler, requests } = setup();
  const http = mockHttp({ rating: 'down', messages: conversation });
  await handler(http.req, http.res);
  expect(http.status).toBe(400);
  expect(http.json.error?.code).toBe('FEEDBACK_CONSENT_REQUIRED');
  expect(requests).toHaveLength(0);
});

it('requires login and a rating', async () => {
  const anonymous = setup({ getSession: async () => null });
  const a = mockHttp({ rating: 'down', consent: true, messages: conversation });
  await anonymous.handler(a.req, a.res);
  expect(a.status).toBe(401);

  const { handler, requests } = setup();
  const b = mockHttp({ consent: true, messages: conversation });
  await handler(b.req, b.res);
  expect(b.status).toBe(400);
  expect(requests).toHaveLength(0);
});

it('stores a 👎 comment without the conversation when the user does not agree to share it (issue #2234)', async () => {
  const { handler, requests } = setup();
  const http = mockHttp({ rating: 'down', consent: false, comment: ' Die Frist stimmt nicht. ', route: '/course/[courseId]' });
  await handler(http.req, http.res);

  expect(http.status).toBe(204);
  expect(requests).toHaveLength(1);
  expect(requests[0].body.variables.object).toEqual({ conversation: null, comment: 'Die Frist stimmt nicht.', route: '/course/[courseId]', model: 'fake' });
});

it('ignores a comment on 👍 and a blank comment', async () => {
  const { handler, requests } = setup();
  for (const body of [{ rating: 'up', comment: 'super' }, { rating: 'down', consent: false, comment: '   ' }]) {
    const http = mockHttp(body);
    await handler(http.req, http.res);
    expect(http.status).toBe(204);
  }
  expect(requests).toHaveLength(0);
});
