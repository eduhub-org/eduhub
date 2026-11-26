/**
 * @jest-environment node
 */
import { createHmac } from 'crypto';
import { mockHttp, session } from '../assistant/testing/helpers';
import { GithubClient, GithubConfig, readGithubConfig } from './client';
import { createAdminHandler, createWebhookHandler, validSignature } from './handlers';
import { IssueState, renderFooter, statusFromIssue, withFooter } from './issues';
import { ReportStore, StoredReport, syncFromGithub } from './reportSync';

beforeEach(() => {
  jest.spyOn(console, 'info').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

const CONFIG: GithubConfig = {
  appId: '1',
  installationId: '2',
  privateKey: 'unused',
  webhookSecret: 'hook-secret',
  owner: 'eduhub-org',
  repo: 'eduhub',
  projectNumber: 4,
};

interface FakeIssue {
  open: boolean;
  stateReason?: string | null;
  column?: string | null;
  duplicateOf?: number | null;
  body?: string;
  title?: string;
  labels?: string[];
  repo?: string;
}

/** An in-memory GitHub: issues by number, the board's columns, and a log of writes. */
const fakeGithub = (issues: Record<number, FakeIssue | null> = {}, config: Partial<GithubConfig> = {}) => {
  const writes: string[] = [];
  let next = 100;
  const numberOf = (nodeId: string) => Number(nodeId.replace('I_', ''));
  const gh: GithubClient & { writes: string[]; issues: typeof issues } = {
    config: { ...CONFIG, ...config },
    writes,
    issues,
    async rest<T>(method: string, path: string, body?: any) {
      const number = Number(path.split('/').pop());
      if (method === 'POST') {
        const n = next++;
        issues[n] = { open: true, body: body.body, title: body.title, labels: body.labels };
        writes.push(`create #${n}`);
        return { number: n, node_id: `I_${n}` } as T;
      }
      if (method === 'GET') return { body: issues[number]?.body ?? null } as T;
      writes.push(`footer #${number}`);
      (issues[number] as FakeIssue).body = body.body;
      return {} as T;
    },
    async graphql<T>(query: string, variables: Record<string, any>) {
      const name = /(?:query|mutation) (\w+)/.exec(query)?.[1];
      if (name === 'EduhubIssue') {
        const i = issues[variables.number];
        if (!i) return { repository: { issue: null } } as T;
        return {
          repository: {
            issue: {
              id: `I_${variables.number}`,
              number: variables.number,
              state: i.open ? 'OPEN' : 'CLOSED',
              stateReason: i.stateReason ?? null,
              repository: { nameWithOwner: i.repo ?? 'eduhub-org/eduhub' },
              duplicateOf: i.duplicateOf ? { number: i.duplicateOf, repository: { nameWithOwner: 'eduhub-org/eduhub' } } : null,
              projectItems: {
                nodes: i.column !== undefined ? [{ id: `PVTI_${variables.number}`, project: { number: 4, owner: { login: 'eduhub-org' } }, fieldValueByName: i.column ? { name: i.column } : null }] : [],
              },
            },
          },
        } as T;
      }
      if (name === 'EduhubBoard')
        return {
          organization: {
            projectV2: { id: 'PVT', field: { id: 'F', options: [{ id: 'o-todo', name: 'Todo' }, { id: 'o-prog', name: 'In Progress' }] } },
          },
        } as T;
      if (name === 'EduhubAddToBoard') {
        const n = numberOf(variables.contentId);
        (issues[n] as FakeIssue).column = null;
        writes.push(`board #${n}`);
        return { addProjectV2ItemById: { item: { id: `PVTI_${n}` } } } as T;
      }
      if (name === 'EduhubSetColumn') {
        const n = Number(String(variables.itemId).replace('PVTI_', ''));
        const column = variables.optionId === 'o-prog' ? 'In Progress' : 'Todo';
        (issues[n] as FakeIssue).column = column;
        writes.push(`column #${n} ${column}`);
        return {} as T;
      }
      if (name === 'EduhubClose') {
        const n = numberOf(variables.issueId);
        Object.assign(issues[n] as FakeIssue, {
          open: false,
          stateReason: variables.reason,
          duplicateOf: variables.duplicateIssueId ? numberOf(variables.duplicateIssueId) : null,
        });
        writes.push(`close #${n} ${variables.reason}${variables.duplicateIssueId ? ` of ${variables.duplicateIssueId}` : ''}`);
        return {} as T;
      }
      if (name === 'EduhubReopen') {
        const n = numberOf(variables.issueId);
        Object.assign(issues[n] as FakeIssue, { open: true, stateReason: 'REOPENED', duplicateOf: null });
        writes.push(`reopen #${n}`);
        return {} as T;
      }
      if (name === 'EduhubIssueByNode') {
        const n = numberOf(variables.id);
        return { node: issues[n] ? { number: n, repository: { nameWithOwner: 'eduhub-org/eduhub' } } : null } as T;
      }
      throw new Error(`unexpected ${name}`);
    },
  };
  return gh;
};

const report = (overrides: Partial<StoredReport> = {}): StoredReport => ({
  id: 1,
  type: 'BUG',
  status: 'NEW',
  priority: 'HIGH',
  duplicateOfId: null,
  githubIssueNumber: null,
  people: 3,
  ...overrides,
});

const fakeStore = (rows: StoredReport[]) => {
  const byId = new Map(rows.map((r) => [r.id, { ...r }]));
  const store: ReportStore & { byId: typeof byId } = {
    byId,
    async get(id) {
      return byId.get(id) ?? null;
    },
    async getByIssue(number) {
      return [...byId.values()].find((r) => r.githubIssueNumber === number) ?? null;
    },
    async update(id, set) {
      Object.assign(byId.get(id) as StoredReport, set);
    },
  };
  return store;
};

const admin = () => ({ ...session({ allowedRoles: ['user', 'admin'] }) });

const adminSetup = (rows: StoredReport[], issues: Record<number, FakeIssue | null> = {}, gh: ReturnType<typeof fakeGithub> | null = fakeGithub(issues)) => {
  const store = fakeStore(rows);
  const handler = createAdminHandler({ getSession: async () => admin(), github: () => gh, store: () => store });
  const call = async (body: unknown, method = 'POST') => {
    const http = mockHttp(body, {}, method);
    await handler(http.req, http.res);
    return http;
  };
  return { store, gh, call };
};

describe('statusFromIssue', () => {
  const state = (s: Partial<IssueState>): IssueState => ({
    nodeId: 'I',
    number: 1,
    open: true,
    stateReason: null,
    duplicateOfNumber: null,
    boardItem: null,
    ...s,
  });
  it.each<[Partial<IssueState>, string]>([
    [{ open: false, stateReason: 'COMPLETED' }, 'DONE'],
    [{ open: false, stateReason: 'NOT_PLANNED' }, 'DECLINED'],
    [{ open: false, stateReason: 'DUPLICATE' }, 'DUPLICATE'],
    [{ open: false, duplicateOfNumber: 4 }, 'DUPLICATE'],
    [{ open: true, boardItem: { id: 'x', column: 'In Progress' } }, 'IN_PROGRESS'],
    [{ open: true, boardItem: { id: 'x', column: 'Backlog' } }, 'PLANNED'],
  ])('%j → %s', (s, expected) => expect(statusFromIssue(state(s))).toBe(expected));
});

describe('footer', () => {
  it('holds no personal data and is replaced, not repeated', () => {
    const first = withFooter('Body', renderFooter({ reportId: 5, priority: null, people: 1 }));
    const second = withFooter(first, renderFooter({ reportId: 5, priority: 'LOW', people: 2 }));
    expect(second).toContain('EduHub report #5 · priority: low · 2 people affected');
    expect(second.match(/eduhub-report:start/g)).toHaveLength(1);
  });
});

describe('readGithubConfig', () => {
  it('is off without the full App configuration and reads the repo and board', () => {
    expect(readGithubConfig({ GITHUB_APP_ID: '1' })).toBeNull();
    expect(
      readGithubConfig({
        GITHUB_APP_ID: '1',
        GITHUB_APP_INSTALLATION_ID: '2',
        GITHUB_APP_PRIVATE_KEY: '-----BEGIN-----\\nabc',
        GITHUB_APP_WEBHOOK_SECRET: 's',
        GITHUB_ISSUE_REPO: 'eduhub-org/eduhub',
        GITHUB_PROJECT_NUMBER: '4',
      })
    ).toMatchObject({ owner: 'eduhub-org', repo: 'eduhub', projectNumber: 4, privateKey: '-----BEGIN-----\nabc' });
  });
});

describe('admin route', () => {
  it('refuses non-admins', async () => {
    const store = fakeStore([]);
    const handler = createAdminHandler({ getSession: async () => session(), github: () => null, store: () => store });
    const http = mockHttp({ action: 'status', reportId: 1, status: 'DONE' });
    await handler(http.req, http.res);
    expect(http.status).toBe(403);
  });

  it('says whether the sync is on', async () => {
    expect((await adminSetup([]).call(undefined, 'GET')).json).toEqual({ enabled: true, repo: 'eduhub-org/eduhub' });
    expect((await adminSetup([], {}, null).call(undefined, 'GET')).json).toEqual({ enabled: false, repo: null });
  });

  it('creates the issue with the confirmed text, labels and footer, puts it on the board and approves the report', async () => {
    const { store, gh, call } = adminSetup([report({ type: 'FEATURE' })]);
    const http = await call({ action: 'create', reportId: 1, status: 'IN_PROGRESS', title: 'Calendar export', description: 'Edited text' });
    expect(http.status).toBe(200);
    expect(http.json).toEqual({ ok: true, issueNumber: 100, issueUrl: 'https://github.com/eduhub-org/eduhub/issues/100' });
    expect(gh?.issues[100]).toMatchObject({ title: 'Calendar export', labels: ['feature', 'from-assistant'] });
    expect(gh?.issues[100]?.body).toMatch(/^Edited text\n\n<!-- eduhub-report:start -->/);
    expect(gh?.issues[100]?.body).toContain('EduHub report #1 · priority: high · 3 people affected');
    expect(gh?.writes).toEqual(['create #100', 'board #100', 'column #100 In Progress']);
    expect(store.byId.get(1)).toMatchObject({ status: 'IN_PROGRESS', githubIssueNumber: 100 });
  });

  it('needs the dialog for approving an unlinked report, but not for closing one', async () => {
    const { store, call } = adminSetup([report()]);
    expect((await call({ action: 'status', reportId: 1, status: 'PLANNED' })).json).toEqual({ error: { code: 'ISSUE_REQUIRED' } });
    expect((await call({ action: 'status', reportId: 1, status: 'DECLINED' })).status).toBe(200);
    expect(store.byId.get(1)?.status).toBe('DECLINED');
  });

  it('works as before while the sync is off', async () => {
    const { store, call } = adminSetup([report()], {}, null);
    expect((await call({ action: 'status', reportId: 1, status: 'PLANNED' })).status).toBe(200);
    expect(store.byId.get(1)?.status).toBe('PLANNED');
    expect((await call({ action: 'create', reportId: 1, status: 'PLANNED', title: 't', description: 'd' })).json).toEqual({
      error: { code: 'GITHUB_OFF' },
    });
  });

  it('links an existing issue: footer appended, reopened and moved, refused when another report has it', async () => {
    const { store, gh, call } = adminSetup(
      [report(), report({ id: 2, githubIssueNumber: 50, status: 'PLANNED' })],
      { 42: { open: false, stateReason: 'COMPLETED', column: 'Done', body: 'Team text' }, 50: { open: true, column: 'Todo' } }
    );
    expect((await call({ action: 'link', reportId: 1, status: 'PLANNED', issueNumber: 50 })).json).toEqual({
      error: { code: 'ISSUE_TAKEN', reportId: 2 },
    });
    expect((await call({ action: 'link', reportId: 1, status: 'PLANNED', issueNumber: 999 })).json).toEqual({
      error: { code: 'ISSUE_NOT_FOUND' },
    });
    expect((await call({ action: 'link', reportId: 1, status: 'PLANNED', issueNumber: 42 })).status).toBe(200);
    expect(gh?.writes).toEqual(['reopen #42', 'column #42 Todo', 'footer #42']);
    expect(gh?.issues[42]?.body).toMatch(/^Team text\n\n<!-- eduhub-report:start -->/);
    expect(store.byId.get(1)).toMatchObject({ status: 'PLANNED', githubIssueNumber: 42 });
  });

  it('writes status changes of linked reports through to GitHub first', async () => {
    const { store, gh, call } = adminSetup(
      [report({ status: 'PLANNED', githubIssueNumber: 7 }), report({ id: 2, status: 'PLANNED', githubIssueNumber: 8, people: 1 })],
      { 7: { open: true, column: 'Todo' }, 8: { open: true, column: 'Todo', body: 'x' } }
    );
    expect((await call({ action: 'status', reportId: 1, status: 'NEW' })).json).toEqual({ error: { code: 'LINKED_CANNOT_BE_NEW' } });
    await call({ action: 'status', reportId: 1, status: 'DECLINED' });
    expect(gh?.writes).toEqual(['close #7 NOT_PLANNED']);
    await call({ action: 'status', reportId: 1, status: 'DUPLICATE', duplicateOfId: 2 });
    expect(gh?.writes.slice(1)).toEqual(['reopen #7', 'close #7 DUPLICATE of I_8', 'footer #8']);
    expect(store.byId.get(1)).toMatchObject({ status: 'DUPLICATE', duplicateOfId: 2 });
  });

  it('leaves both sides unchanged when GitHub fails', async () => {
    const gh = fakeGithub({ 7: { open: true, column: 'Todo' } });
    gh.graphql = async () => {
      throw new Error('network');
    };
    const { store, call } = adminSetup([report({ status: 'PLANNED', githubIssueNumber: 7 })], {}, gh);
    const http = await call({ action: 'status', reportId: 1, status: 'DONE' });
    expect(http.status).toBe(502);
    expect(store.byId.get(1)?.status).toBe('PLANNED');
  });
});

describe('syncFromGithub', () => {
  it('follows closing, reopening, board moves, duplicates and deletion', async () => {
    const issues: Record<number, FakeIssue | null> = { 7: { open: true, column: 'In Progress' }, 8: { open: true, column: 'Todo', body: '' } };
    const gh = fakeGithub(issues);
    const store = fakeStore([report({ status: 'PLANNED', githubIssueNumber: 7 }), report({ id: 2, status: 'PLANNED', githubIssueNumber: 8 })]);

    expect(await syncFromGithub(gh, store, 7)).toBe('updated');
    expect(store.byId.get(1)?.status).toBe('IN_PROGRESS');
    expect(await syncFromGithub(gh, store, 7)).toBe('unchanged');

    issues[7] = { open: false, stateReason: 'DUPLICATE', duplicateOf: 8 };
    expect(await syncFromGithub(gh, store, 7)).toBe('updated');
    expect(store.byId.get(1)).toMatchObject({ status: 'DUPLICATE', duplicateOfId: 2 });

    issues[7] = null;
    expect(await syncFromGithub(gh, store, 7)).toBe('unlinked');
    expect(store.byId.get(1)).toMatchObject({ status: 'DUPLICATE', githubIssueNumber: null });

    expect(await syncFromGithub(gh, store, 12345)).toBe('none');
  });

  it("keeps EduHub's PLANNED or IN_PROGRESS when there is no board", async () => {
    const gh = fakeGithub({ 7: { open: true } }, { projectNumber: null });
    const store = fakeStore([report({ status: 'IN_PROGRESS', githubIssueNumber: 7 })]);
    expect(await syncFromGithub(gh, store, 7)).toBe('unchanged');
  });
});

describe('webhook', () => {
  const sign = (body: string, secret = 'hook-secret') => `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;

  const setup = (issues: Record<number, FakeIssue | null>, rows: StoredReport[]) => {
    const gh = fakeGithub(issues);
    const store = fakeStore(rows);
    const deliver = async (event: string, payload: unknown, signature?: string) => {
      const raw = JSON.stringify(payload);
      const handler = createWebhookHandler({ github: () => gh, store: () => store, readRawBody: async () => raw });
      const http = mockHttp(undefined, { 'x-github-event': event, 'x-hub-signature-256': signature ?? sign(raw) });
      await handler(http.req, http.res);
      return http;
    };
    return { gh, store, deliver };
  };

  it('checks the signature in constant time against the raw body', () => {
    expect(validSignature('s', 'body', sign('body', 's'))).toBe(true);
    expect(validSignature('s', 'body', sign('other', 's'))).toBe(false);
    expect(validSignature('s', 'body', undefined)).toBe(false);
    expect(validSignature('s', 'body', 'sha256=short')).toBe(false);
  });

  it('refuses unsigned deliveries', async () => {
    const { store, deliver } = setup({ 7: { open: false, stateReason: 'COMPLETED' } }, [report({ status: 'PLANNED', githubIssueNumber: 7 })]);
    const http = await deliver('issues', { action: 'closed', issue: { number: 7 }, repository: { full_name: 'eduhub-org/eduhub' } }, 'sha256=forged');
    expect(http.status).toBe(401);
    expect(store.byId.get(1)?.status).toBe('PLANNED');
  });

  it('updates the report from the issue as GitHub has it, not from the payload', async () => {
    const { store, deliver } = setup({ 7: { open: false, stateReason: 'NOT_PLANNED' } }, [report({ status: 'PLANNED', githubIssueNumber: 7 })]);
    const http = await deliver('issues', { action: 'reopened', issue: { number: 7 }, repository: { full_name: 'eduhub-org/eduhub' } });
    expect(http.json).toEqual({ ok: true, result: 'updated' });
    expect(store.byId.get(1)?.status).toBe('DECLINED');
  });

  it('follows board moves and ignores other repos and events', async () => {
    const { store, deliver } = setup({ 7: { open: true, column: 'In Progress' } }, [report({ status: 'PLANNED', githubIssueNumber: 7 })]);
    expect((await deliver('issues', { issue: { number: 7 }, repository: { full_name: 'other/repo' } })).json).toEqual({ ok: true, ignored: 'issues' });
    expect((await deliver('ping', {})).json).toEqual({ ok: true, ignored: 'ping' });
    expect(store.byId.get(1)?.status).toBe('PLANNED');
    await deliver('projects_v2_item', { action: 'edited', projects_v2_item: { content_type: 'Issue', content_node_id: 'I_7' } });
    expect(store.byId.get(1)?.status).toBe('IN_PROGRESS');
  });
});
