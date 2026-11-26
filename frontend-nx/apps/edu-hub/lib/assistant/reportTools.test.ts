/**
 * @jest-environment node
 */
import {
  createHasuraReportSearch,
  createReportTools,
  rankHits,
  ReportSearch,
  SearchHit,
  searchWords,
} from './reportTools';

const hit = (overrides: Partial<SearchHit> = {}): SearchHit => ({
  id: 4,
  type: 'BUG',
  title: 'CSV export broken',
  description: 'Exporting participants as CSV fails with an error.',
  status: 'NEW',
  people: 2,
  duplicates: 0,
  askerVoted: false,
  ...overrides,
});

const fakeSearch = (hits: SearchHit[]): ReportSearch & { calls: unknown[] } => {
  const calls: unknown[] = [];
  return {
    calls,
    async search(words, userId) {
      calls.push({ words, userId });
      return hits;
    },
    async get(reportId, userId) {
      calls.push({ reportId, userId });
      return hits.find((h) => h.id === reportId) ?? null;
    },
  };
};

const myReports = (votes: unknown[]) => {
  const requests: { headers: Record<string, string>; body: any }[] = [];
  const fetchImpl = (async (_url: string, init: RequestInit) => {
    requests.push({ headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body)) });
    return new Response(JSON.stringify({ data: { IssueReportVote: votes } }));
  }) as unknown as typeof fetch;
  return { caller: { url: 'http://h', token: 'alice-token', userId: 'alice', fetchImpl }, requests };
};

const toolNames = ['search_reports', 'get_my_reports', 'propose_report', 'propose_vote', 'propose_withdraw'];

it('offers the five report tools with strict schemas', () => {
  const tools = createReportTools(myReports([]).caller, fakeSearch([]));
  expect(tools.definitions.map((d) => d.function.name)).toEqual(toolNames);
  tools.definitions.forEach((d) =>
    expect(d.function.parameters).toEqual(expect.objectContaining({ additionalProperties: false }))
  );
});

it('searches open reports by words and ranks the best matches first', async () => {
  const search = fakeSearch([hit({ id: 1, title: 'Dark mode', description: 'Please add one', people: 9 }), hit()]);
  const tools = createReportTools(myReports([]).caller, search);
  const result = await tools.call('search_reports', JSON.stringify({ query: 'CSV-Export geht nicht' }));
  expect(result.status).toBe('ok');
  expect(search.calls[0]).toEqual({ words: ['csv', 'export', 'geht', 'nicht'], userId: 'alice' });
  expect(JSON.parse(result.content).reports.map((r: { id: number }) => r.id)).toEqual([4]);
});

it('says when the search is unavailable', async () => {
  const tools = createReportTools(myReports([]).caller, null);
  const result = await tools.call('search_reports', JSON.stringify({ query: 'export' }));
  expect(JSON.parse(result.content)).toEqual({ available: false, reports: [] });
});

it('drafts a report as a card without saving anything', async () => {
  const { caller, requests } = myReports([]);
  const tools = createReportTools(caller, fakeSearch([]));
  const result = await tools.call(
    'propose_report',
    JSON.stringify({ type: 'FEATURE', title: 'Dark mode', description: 'A dark theme for the whole platform.' })
  );
  expect(result).toEqual(
    expect.objectContaining({
      status: 'ok',
      report: {
        kind: 'create',
        type: 'FEATURE',
        title: 'Dark mode',
        description: 'A dark theme for the whole platform.',
      },
    })
  );
  expect(requests).toHaveLength(0);
});

it('rejects a user id or other unknown arguments', async () => {
  const tools = createReportTools(myReports([]).caller, fakeSearch([]));
  const result = await tools.call(
    'propose_report',
    JSON.stringify({ type: 'BUG', title: 'Broken export', description: 'It fails every time.', userId: 'bob' })
  );
  expect(result.status).toBe('invalid');
});

it('offers a vote only on an open report the user does not support yet', async () => {
  const search = fakeSearch([hit(), hit({ id: 5, askerVoted: true }), hit({ id: 6, status: 'DONE' })]);
  const tools = createReportTools(myReports([]).caller, search);
  const summary = 'The CSV export fails.';

  const ok = await tools.call('propose_vote', JSON.stringify({ reportId: 4, summary }));
  expect(ok).toEqual(
    expect.objectContaining({ status: 'ok', report: { kind: 'vote', reportId: 4, type: 'BUG', summary } })
  );

  for (const [reportId, code] of [
    [5, 'ALREADY_COUNTED'],
    [6, 'NOT_FOUND'],
    [99, 'NOT_FOUND'],
  ] as const) {
    const refused = await tools.call('propose_vote', JSON.stringify({ reportId, summary }));
    expect(refused).toEqual(expect.objectContaining({ status: 'error', errorCode: code }));
  }
});

it("lists the user's own reports and votes with their own token, pinned to their id", async () => {
  const { caller, requests } = myReports([
    {
      summary: 'Dark mode',
      isReporter: true,
      created_at: 't1',
      IssueReport: { id: 2, type: 'FEATURE', status: 'NEW', publicNote: null, updated_at: 't2' },
    },
    {
      summary: 'CSV export fails',
      isReporter: false,
      created_at: 't3',
      IssueReport: { id: 4, type: 'BUG', status: 'PLANNED', publicNote: 'Spring', updated_at: 't4' },
    },
  ]);
  const tools = createReportTools(caller, null);
  const result = await tools.call('get_my_reports', '{}');

  expect(requests[0].headers).toEqual(
    expect.objectContaining({ authorization: 'Bearer alice-token', 'x-hasura-role': 'user' })
  );
  expect(requests[0].body.variables).toEqual({ userId: 'alice' });
  expect(JSON.parse(result.content).reports).toEqual([
    expect.objectContaining({
      id: 2,
      summary: 'Dark mode',
      sentByUser: true,
      status: 'NEW',
      teamNote: null,
      canWithdraw: true,
    }),
    expect.objectContaining({
      id: 4,
      summary: 'CSV export fails',
      sentByUser: false,
      status: 'PLANNED',
      teamNote: 'Spring',
      canWithdraw: false,
    }),
  ]);
});

it("drafts a withdrawal only for the user's own new report that nobody else joined", async () => {
  // Like Hasura: the query returns the caller's own reporter vote on that one report, if any.
  const own: Record<number, unknown> = {
    2: { summary: 'Dark mode', IssueReport: { id: 2, status: 'NEW' } },
    3: { summary: 'Planned one', IssueReport: { id: 3, status: 'PLANNED' } },
    5: { summary: 'Joined by others', IssueReport: { id: 5, status: 'NEW' } },
    6: { summary: 'Has a duplicate', IssueReport: { id: 6, status: 'NEW' } },
  };
  const requests: any[] = [];
  const fetchImpl = (async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    requests.push(body);
    const vote = own[body.variables.reportId];
    return new Response(JSON.stringify({ data: { IssueReportVote: vote ? [vote] : [] } }));
  }) as unknown as typeof fetch;
  const search = fakeSearch([hit({ id: 2, people: 1 }), hit({ id: 5, people: 3 }), hit({ id: 6, people: 1, duplicates: 1 })]);
  const tools = createReportTools({ url: 'http://h', token: 'alice-token', userId: 'alice', fetchImpl }, search);

  expect(await tools.call('propose_withdraw', JSON.stringify({ reportId: 2 }))).toEqual(
    expect.objectContaining({ status: 'ok', report: { kind: 'withdraw', reportId: 2, summary: 'Dark mode' } })
  );
  expect(requests[0].variables).toEqual({ userId: 'alice', reportId: 2 });
  for (const [reportId, code] of [
    [3, 'NOT_NEW'],
    [4, 'NOT_FOUND'],
    [5, 'OTHERS_JOINED'],
    [6, 'OTHERS_JOINED'],
  ] as const) {
    expect(await tools.call('propose_withdraw', JSON.stringify({ reportId }))).toEqual(
      expect.objectContaining({ errorCode: code })
    );
  }
});

it('search words: three letters or more, no duplicates, at most eight', () => {
  expect(searchWords('Ich kann den CSV-Export nicht nutzen, CSV!')).toEqual([
    'ich',
    'kann',
    'den',
    'csv',
    'export',
    'nicht',
    'nutzen',
  ]);
  expect(searchWords('a b c')).toEqual([]);
  expect(rankHits([hit({ title: 'x', description: 'y' })], ['csv'])).toEqual([]);
});

it("the admin search only asks for open reports and the asker's own votes", async () => {
  const requests: { headers: Record<string, string>; body: any }[] = [];
  const fetchImpl = (async (_url: string, init: RequestInit) => {
    requests.push({ headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body)) });
    return new Response(
      JSON.stringify({
        data: {
          IssueReport: [
            {
              id: 4,
              type: 'BUG',
              title: 't',
              description: 'd',
              status: 'NEW',
              Votes_aggregate: { aggregate: { count: 3 } },
              AskerVotes: [{ id: 1 }],
            },
          ],
        },
      })
    );
  }) as unknown as typeof fetch;
  const search = createHasuraReportSearch({ url: 'http://h', adminSecret: 's', fetchImpl });
  expect(await search.search(['50%'], 'alice')).toEqual([
    { id: 4, type: 'BUG', title: 't', description: 'd', status: 'NEW', people: 3, duplicates: 0, askerVoted: true },
  ]);
  const { where, userId } = requests[0].body.variables;
  expect(userId).toBe('alice');
  expect(where._and[0]).toEqual({ status: { _in: ['NEW', 'PLANNED', 'IN_PROGRESS'] } });
  expect(where._and[1]._or[0]).toEqual({ title: { _ilike: '%50\\%%' } });
});
