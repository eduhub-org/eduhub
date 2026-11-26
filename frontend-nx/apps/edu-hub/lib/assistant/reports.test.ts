/**
 * @jest-environment node
 */
import { createReportsHandler, ReportsHandlerDeps } from './reports';
import { mockHttp, session } from './testing/helpers';

beforeEach(() => {
  jest.spyOn(console, 'info').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

type Answer = { data?: unknown; errors?: { message: string; extensions: { code: string } }[] };

const setup = (answer: (query: string) => Answer, overrides: Partial<ReportsHandlerDeps> = {}) => {
  const requests: { headers: Record<string, string>; body: any }[] = [];
  const fetchImpl = (async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    requests.push({ headers: init.headers as Record<string, string>, body });
    return new Response(JSON.stringify(answer(body.query)));
  }) as unknown as typeof fetch;
  const handler = createReportsHandler({
    getSession: async () => session(),
    hasuraUrl: 'http://h',
    contact: 'edu@opencampus.sh',
    fetchImpl,
    now: () => new Date('2026-11-26T12:00:00Z'),
    ...overrides,
  });
  return { handler, requests };
};

const countToday = (count: number) => ({ data: { IssueReportVote_aggregate: { aggregate: { count } } } });
const hasuraError = (code: string, message: string): Answer => ({ errors: [{ message, extensions: { code } }] });

const create = {
  action: 'create',
  type: 'BUG',
  title: ' Export broken ',
  description: 'The CSV export fails.',
  route: '/manage/courses',
  locale: 'en',
};

it("saves a report with the user's own token under the user role, with the reporter's own vote", async () => {
  const { handler, requests } = setup((q) =>
    q.includes('ReportsToday') ? countToday(0) : { data: { insert_IssueReport_one: { id: 7 } } }
  );
  const http = mockHttp(create, { 'x-hasura-role': 'instructor' });
  await handler(http.req, http.res);

  expect(http.status).toBe(200);
  expect(http.json).toEqual({ reportId: 7 });
  expect(requests).toHaveLength(2);
  requests.forEach((r) =>
    expect(r.headers).toEqual(expect.objectContaining({ authorization: 'Bearer alice-token', 'x-hasura-role': 'user' }))
  );
  expect(requests[0].body.variables).toEqual({ userId: 'alice', since: '2026-11-25T12:00:00.000Z' });
  expect(requests[1].body.variables.object).toEqual({
    type: 'BUG',
    title: 'Export broken',
    description: 'The CSV export fails.',
    route: '/manage/courses',
    role: 'instructor',
    locale: 'en',
    Votes: { data: [{ summary: 'Export broken' }] },
  });
  // The user id comes from Hasura's preset, never from the request.
  expect(JSON.stringify(requests[1].body.variables)).not.toContain('alice');
});

it('refuses a sixth report within 24 hours', async () => {
  const { handler, requests } = setup(() => countToday(5));
  const http = mockHttp(create);
  await handler(http.req, http.res);
  expect(http.status).toBe(429);
  expect(http.json.error?.code).toBe('REPORT_LIMIT_REACHED');
  expect(requests).toHaveLength(1);
});

it('answers with the limit when the database refuses a report over it', async () => {
  const { handler } = setup((q) =>
    q.includes('ReportsToday') ? countToday(4) : hasuraError('permission-error', 'Check constraint violation. REPORT_LIMIT_REACHED')
  );
  const http = mockHttp(create);
  await handler(http.req, http.res);
  expect(http.status).toBe(429);
  expect(http.json.error?.code).toBe('REPORT_LIMIT_REACHED');
});

it('refuses invalid reports without calling Hasura', async () => {
  const { handler, requests } = setup(() => countToday(0));
  for (const body of [
    { ...create, type: 'QUESTION' },
    { ...create, title: '  ' },
    { ...create, description: 'x'.repeat(4001) },
    { action: 'vote', reportId: 'one', summary: 'x' },
    { action: 'withdraw', reportId: -1 },
    { action: 'delete', reportId: 1 },
  ]) {
    const http = mockHttp(body);
    await handler(http.req, http.res);
    expect(http.status).toBe(400);
  }
  expect(requests).toHaveLength(0);
});

it('adds a vote with the summary the user saw', async () => {
  const { handler, requests } = setup(() => ({ data: { insert_IssueReportVote_one: { id: 3, issueReportId: 4 } } }));
  const http = mockHttp({ action: 'vote', reportId: 4, summary: 'The CSV export does not work.' });
  await handler(http.req, http.res);
  expect(http.status).toBe(200);
  expect(requests[0].body.variables).toEqual({
    object: { issueReportId: 4, summary: 'The CSV export does not work.' },
  });
});

it("refreshes the linked issue's footer after a vote, and a failure there doesn't fail the vote", async () => {
  const onVoted = jest.fn().mockRejectedValue(new Error('GitHub down'));
  const { handler } = setup(() => ({ data: { insert_IssueReportVote_one: { id: 3, issueReportId: 4 } } }), { onVoted });
  const http = mockHttp({ action: 'vote', reportId: 4, summary: 'Same problem' });
  await handler(http.req, http.res);
  expect(http.status).toBe(200);
  expect(onVoted).toHaveBeenCalledWith(4);
});

it('tells a second vote apart from a closed or missing report', async () => {
  const twice = setup(() => hasuraError('constraint-violation', 'Uniqueness violation. duplicate key value'));
  const a = mockHttp({ action: 'vote', reportId: 4, summary: 'Same problem' });
  await twice.handler(a.req, a.res);
  expect(a.status).toBe(409);
  expect(a.json.error?.code).toBe('REPORT_ALREADY_VOTED');

  for (const answer of [
    hasuraError('permission-error', 'check constraint of an insert/update permission has failed'),
    hasuraError('constraint-violation', 'Foreign key violation.'),
  ]) {
    const closed = setup(() => answer);
    const b = mockHttp({ action: 'vote', reportId: 4, summary: 'Same problem' });
    await closed.handler(b.req, b.res);
    expect(b.status).toBe(409);
    expect(b.json.error?.code).toBe('REPORT_CLOSED');
  }
});

it('withdraws only what Hasura lets the user delete', async () => {
  const ok = setup(() => ({ data: { delete_IssueReport: { affected_rows: 1 } } }));
  const a = mockHttp({ action: 'withdraw', reportId: 4 });
  await ok.handler(a.req, a.res);
  expect(a.status).toBe(200);

  const refused = setup(() => ({ data: { delete_IssueReport: { affected_rows: 0 } } }));
  const b = mockHttp({ action: 'withdraw', reportId: 4 });
  await refused.handler(b.req, b.res);
  expect(b.status).toBe(409);
  expect(b.json.error?.code).toBe('REPORT_NOT_WITHDRAWABLE');
});

it('requires login, refuses while viewing as someone else, and never logs the report', async () => {
  const anonymous = setup(() => countToday(0), { getSession: async () => null });
  const a = mockHttp(create);
  await anonymous.handler(a.req, a.res);
  expect(a.status).toBe(401);

  const impersonating = setup(() => countToday(0), { getSession: async () => session({ impersonating: true }) });
  const b = mockHttp(create);
  await impersonating.handler(b.req, b.res);
  expect(b.status).toBe(403);

  const failing = setup(() => hasuraError('unexpected', 'Export broken: The CSV export fails.'));
  const c = mockHttp(create);
  await failing.handler(c.req, c.res);
  expect(c.status).toBe(503);
  const logged = JSON.stringify([(console.error as jest.Mock).mock.calls, (console.info as jest.Mock).mock.calls]);
  expect(logged).not.toMatch(/Export broken|CSV/);
});
