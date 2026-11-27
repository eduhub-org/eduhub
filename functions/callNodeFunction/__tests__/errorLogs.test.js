import { errorGroupOf, errorLogConfig, groupErrors, MAX_ENTRIES, normalizeMessage, readErrorEntries } from '../lib/errorLogs.js';

const settings = (values) => (name) => values[name];
const config = { project: 'eduhub-production', filter: 'severity>=ERROR' };
/** What AbortSignal.timeout makes fetch reject with. */
const timeoutError = () => Object.assign(new Error('The operation timed out.'), { name: 'TimeoutError' });

const hasuraHttp = (code, error, operationName, timestamp = '2026-11-25T10:00:00Z') => ({
  timestamp,
  resource: { labels: { service_name: 'hasura' } },
  jsonPayload: { type: 'http-log', level: 'error', detail: { operation: { error: { code, error }, query: { operationName }, user_vars: { 'x-hasura-role': 'user' } }, http_info: { ip: '1.2.3.4' } } },
});

/** Answers the metadata server's token request, then the given Cloud Logging pages in turn. */
const fakeFetch = (pages) => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    if (url.includes('metadata')) return new Response(JSON.stringify({ access_token: 'sa-token', expires_in: 3600 }));
    calls.push({ url, init, body: JSON.parse(init.body) });
    const page = pages[calls.length - 1];
    return page instanceof Response ? page : new Response(JSON.stringify(page));
  };
  return { calls, fetchImpl };
};

describe('errorLogConfig', () => {
  it('is off unless project and filter are set', () => {
    expect(errorLogConfig(settings({}))).toBeNull();
    expect(errorLogConfig(settings({ ERROR_LOG_PROJECT: 'p' }))).toBeNull();
    expect(errorLogConfig(settings({ ERROR_LOG_PROJECT: ' p ', ERROR_LOG_FILTER: 'a\n' }))).toEqual({ project: 'p', filter: 'a' });
  });
});

describe('normalizeMessage', () => {
  it('replaces what varies per occurrence and keeps status and error codes', () => {
    expect(normalizeMessage('Failed for user f3a8c2d1-1111-2222-3333-444455556666 in course 42')).toBe('Failed for user <id> in course <n>');
    expect(normalizeMessage('Mail to jane.doe@uni-kiel.de from 10.1.2.3 failed')).toBe('Mail to [email] from <ip> failed');
    expect(normalizeMessage('Error: Hasura request failed: HTTP 500')).toBe('Error: Hasura request failed: HTTP 500');
    expect(normalizeMessage('AxiosError: Request failed with status code 502')).toBe('AxiosError: Request failed with status code 502');
    expect(normalizeMessage('2026-11-20 10:00:00,123 ERROR (executor-thread-12) KC-SERVICES0013: Failed')).toBe('ERROR (executor-thread-<n>) KC-SERVICES0013: Failed');
    expect(normalizeMessage('GET https://x.example/api?token=abc123 failed\n  at stack')).toBe('GET https://x.example/api failed');
    expect(normalizeMessage('x'.repeat(300))).toHaveLength(201);
  });
});

describe('errorGroupOf', () => {
  it('sorts entries into the categories of the Slack alert, without user data', () => {
    expect(errorGroupOf(hasuraHttp('validation-failed', "field 'attendanceData' not found in type: 'Session'", 'ManagedCourse'))).toEqual({
      service: 'hasura',
      kind: 'graphql',
      message: "Hasura validation-failed: field 'attendanceData' not found in type: 'Session'",
      operation: 'ManagedCourse',
    });
    expect(
      errorGroupOf({
        resource: { labels: { service_name: 'hasura' } },
        jsonPayload: { type: 'scheduled-trigger', detail: { code: 'timeout', error: 'Cron Scheduled event "f4a4de98-1b39-4a90-b13b-e64236a2a886" of cron trigger "send_questionaires" timed out' } },
      })
    ).toEqual({ service: 'hasura', kind: 'trigger', message: 'Hasura scheduled-trigger send_questionaires: timeout' });
    expect(errorGroupOf({ resource: { labels: { service_name: 'media' } }, jsonPayload: { level: 'error', message: 'Unsupported image format' } })).toEqual({
      service: 'media',
      kind: 'app',
      message: 'Unsupported image format',
    });
    expect(
      errorGroupOf({ resource: { labels: { service_name: 'call-node-function' } }, textPayload: 'The request was aborted', httpRequest: { status: 500 } })
    ).toEqual({ service: 'call-node-function', kind: 'text', message: 'The request was aborted' });
    expect(errorGroupOf({ resource: { labels: { service_name: 'hasura' } }, httpRequest: { status: 500, requestMethod: 'HEAD' } })).toEqual({
      service: 'hasura',
      kind: 'request',
      message: 'HTTP 500 on HEAD',
    });
    expect(errorGroupOf({ resource: { labels: { service_name: 'hasura' } }, jsonPayload: { type: 'websocket-log', level: 'error' } })).toEqual({
      service: 'hasura',
      kind: 'other',
      message: 'Hasura websocket-log',
    });
  });
});

describe('groupErrors', () => {
  it('counts the same error with different ids as one group, most frequent first', () => {
    const groups = groupErrors([
      { timestamp: '2026-11-24T09:00:00Z', resource: { labels: { service_name: 'media' } }, jsonPayload: { message: 'Unsupported image format' } },
      hasuraHttp('constraint-violation', 'Foreign key violation on 17', 'InsertProjectAuthorRequest', '2026-11-25T10:00:00Z'),
      hasuraHttp('constraint-violation', 'Foreign key violation on 18', 'InsertProjectAuthorRequest', '2026-11-23T08:00:00Z'),
      hasuraHttp('constraint-violation', 'Foreign key violation on 19', 'InsertProjectAuthorRequest', '2026-11-25T11:00:00Z'),
    ]);
    expect(groups).toEqual([
      {
        service: 'hasura',
        kind: 'graphql',
        message: 'Hasura constraint-violation: Foreign key violation on <n>',
        operation: 'InsertProjectAuthorRequest',
        count: 3,
        days: 2,
        firstSeen: '2026-11-23T08:00:00Z',
        lastSeen: '2026-11-25T11:00:00Z',
      },
      { service: 'media', kind: 'app', message: 'Unsupported image format', count: 1, days: 1, firstSeen: '2026-11-24T09:00:00Z', lastSeen: '2026-11-24T09:00:00Z' },
    ]);
  });
});

describe('readErrorEntries', () => {
  const window = { since: '2026-11-23T05:17:00Z', until: '2026-11-30T05:17:00Z' };

  it('pages through Cloud Logging with the alert filter limited to the period', async () => {
    const { calls, fetchImpl } = fakeFetch([{ entries: [{ a: 1 }, { a: 2 }], nextPageToken: 't2' }, { entries: [{ a: 3 }] }]);
    const result = await readErrorEntries(config, { ...window, fetchImpl });

    expect(result).toEqual({ entries: [{ a: 1 }, { a: 2 }, { a: 3 }], complete: true });
    expect(calls).toHaveLength(2);
    expect(calls[0].url).toMatch(/^https:\/\/logging\.googleapis\.com\/v2\/entries:list\?fields=/);
    expect(calls[0].init.headers.Authorization).toBe('Bearer sa-token');
    expect(calls[0].body).toEqual({
      resourceNames: ['projects/eduhub-production'],
      filter: 'severity>=ERROR\nAND timestamp>="2026-11-23T05:17:00Z" AND timestamp<"2026-11-30T05:17:00Z"',
      orderBy: 'timestamp desc',
      pageSize: 1000,
    });
    expect(calls[1].body.pageToken).toBe('t2');
  });

  it('stops at MAX_ENTRIES and reports the result as incomplete', async () => {
    const page = { entries: Array.from({ length: 1000 }, (_, i) => ({ i })), nextPageToken: 'more' };
    const { calls, fetchImpl } = fakeFetch(Array(20).fill(page));
    const result = await readErrorEntries(config, { ...window, fetchImpl });
    expect(result.entries).toHaveLength(MAX_ENTRIES);
    expect(result.complete).toBe(false);
    expect(calls).toHaveLength(MAX_ENTRIES / 1000);
  });

  it('stops when its time is up', async () => {
    let time = 0;
    const { calls, fetchImpl } = fakeFetch([{ entries: [{ a: 1 }], nextPageToken: 'more' }]);
    const result = await readErrorEntries(config, {
      ...window,
      fetchImpl: async (url, init) => {
        const response = await fetchImpl(url, init);
        time += 30_000;
        return response;
      },
      now: () => time,
    });
    expect(result).toEqual({ entries: [{ a: 1 }], complete: false });
    expect(calls).toHaveLength(1);
  });

  it('keeps the pages read when the time runs out while a page loads', async () => {
    const { calls, fetchImpl } = fakeFetch([{ entries: [{ a: 1 }], nextPageToken: 'more' }]);
    const result = await readErrorEntries(config, {
      ...window,
      fetchImpl: async (url, init) => {
        if (calls.length === 1 && !url.includes('metadata')) throw timeoutError();
        return fetchImpl(url, init);
      },
    });
    expect(result).toEqual({ entries: [{ a: 1 }], complete: false });
  });

  it('fails when the time runs out before the first page', async () => {
    const timeout = async (url, init) => {
      if (url.includes('metadata')) return new Response(JSON.stringify({ access_token: 't', expires_in: 3600 }));
      throw timeoutError();
    };
    await expect(readErrorEntries(config, { ...window, fetchImpl: timeout })).rejects.toThrow('timed out');
  });

  it('fails with the status only', async () => {
    const { fetchImpl } = fakeFetch([new Response('{"error":{"message":"filter: severity>=ERROR"}}', { status: 403 })]);
    await expect(readErrorEntries(config, { ...window, fetchImpl })).rejects.toThrow(/^Cloud Logging answered 403$/);
  });
});
