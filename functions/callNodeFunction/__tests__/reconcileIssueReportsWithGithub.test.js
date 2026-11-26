import { jest } from '@jest/globals';
import { createVerify, generateKeyPairSync } from 'crypto';
import reconcileIssueReportsWithGithub, { reportChange } from '../reconcileIssueReportsWithGithub/index.js';
import { appJwt, githubConfig, statusFromIssue, withFooter, renderFooter } from '../lib/github.js';

const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const settings = (values) => (name) => values[name];

const issue = (overrides = {}) => ({
  nodeId: 'I_1',
  number: 7,
  open: true,
  stateReason: null,
  duplicateOfNumber: null,
  boardItem: { id: 'PVTI_1', column: 'Todo' },
  ...overrides,
});

describe('statusFromIssue', () => {
  it.each([
    [{ open: false, stateReason: 'COMPLETED' }, 'DONE'],
    [{ open: false, stateReason: 'NOT_PLANNED' }, 'DECLINED'],
    [{ open: false, stateReason: 'DUPLICATE' }, 'DUPLICATE'],
    [{ open: false, stateReason: 'NOT_PLANNED', duplicateOfNumber: 3 }, 'DUPLICATE'],
    [{ open: false, stateReason: null }, 'DONE'],
    [{ open: true, boardItem: { id: 'x', column: 'In Progress' } }, 'IN_PROGRESS'],
    [{ open: true, boardItem: { id: 'x', column: 'Todo' } }, 'PLANNED'],
    [{ open: true, boardItem: null }, 'PLANNED'],
  ])('%j → %s', (state, status) => {
    expect(statusFromIssue(issue(state))).toBe(status);
  });

  it('treats a missing issue as gone', () => {
    expect(statusFromIssue(null)).toBeNull();
  });
});

describe('reportChange', () => {
  const base = { id: 1, status: 'PLANNED', duplicateOfId: null };
  const ctx = { hasBoard: true, reportIdByIssue: new Map([[7, 1], [9, 2]]) };

  it('unlinks a report whose issue is gone', () => {
    expect(reportChange(base, null, ctx)).toEqual({ githubIssueNumber: null });
  });

  it('follows the issue', () => {
    expect(reportChange(base, issue({ open: false, stateReason: 'COMPLETED' }), ctx)).toEqual({ status: 'DONE' });
    expect(reportChange(base, issue({ boardItem: { id: 'x', column: 'In Progress' } }), ctx)).toEqual({ status: 'IN_PROGRESS' });
    expect(reportChange(base, issue(), ctx)).toBeNull();
  });

  it('keeps PLANNED vs IN_PROGRESS when there is no board to tell them apart', () => {
    expect(reportChange({ ...base, status: 'IN_PROGRESS' }, issue({ boardItem: null }), { ...ctx, hasBoard: false })).toBeNull();
  });

  it('links a duplicate to the report of the original issue', () => {
    const dup = issue({ open: false, stateReason: 'DUPLICATE', duplicateOfNumber: 9 });
    expect(reportChange(base, dup, ctx)).toEqual({ status: 'DUPLICATE', duplicateOfId: 2 });
    expect(reportChange({ ...base, status: 'DUPLICATE', duplicateOfId: 2 }, dup, ctx)).toBeNull();
  });

  it('reads a duplicate of an issue without a report as declined, keeping a link set in EduHub', () => {
    const dup = issue({ open: false, stateReason: 'DUPLICATE', duplicateOfNumber: 99 });
    expect(reportChange({ ...base, status: 'DUPLICATE', duplicateOfId: 5 }, dup, ctx)).toBeNull();
    expect(reportChange(base, dup, ctx)).toEqual({ status: 'DECLINED' });
    expect(reportChange({ ...base, status: 'DECLINED' }, dup, ctx)).toBeNull();
  });
});

describe('footer', () => {
  const footer = renderFooter({ reportId: 12, priority: 'HIGH', people: 3 });

  it('names no person', () => {
    expect(footer).toContain('EduHub report #12 · priority: high · 3 people affected');
  });

  it('is appended once and then replaced in place', () => {
    const once = withFooter('Steps to reproduce', footer);
    expect(once).toBe(`Steps to reproduce\n\n${footer}`);
    const updated = withFooter(`${once}\n\nA developer's note`, renderFooter({ reportId: 12, priority: null, people: 1 }));
    expect(updated).toContain('priority: not set · 1 person affected');
    expect(updated).toContain("A developer's note");
    expect(updated.match(/eduhub-report:start/g)).toHaveLength(1);
  });
});

describe('githubConfig and appJwt', () => {
  it('is off unless the App is fully configured', () => {
    expect(githubConfig(settings({ GITHUB_APP_ID: '1' }))).toBeNull();
    expect(
      githubConfig(settings({ GITHUB_APP_ID: '1', GITHUB_APP_INSTALLATION_ID: '2', GITHUB_APP_PRIVATE_KEY: 'k', GITHUB_ISSUE_REPO: 'eduhub-org/eduhub', GITHUB_PROJECT_NUMBER: '4' }))
    ).toMatchObject({ owner: 'eduhub-org', repo: 'eduhub', projectNumber: 4 });
  });

  it('signs a short-lived RS256 JWT with the App id as issuer', () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const pem = privateKey.export({ type: 'pkcs1', format: 'pem' }).toString();
    const jwt = appJwt('123', pem, new Date('2026-11-26T12:00:00Z'));
    const [header, payload, signature] = jwt.split('.');
    expect(JSON.parse(Buffer.from(header, 'base64url').toString())).toEqual({ alg: 'RS256', typ: 'JWT' });
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    expect(claims.iss).toBe('123');
    expect(claims.exp - claims.iat).toBeLessThanOrEqual(600);
    expect(createVerify('RSA-SHA256').update(`${header}.${payload}`).verify(publicKey, Buffer.from(signature, 'base64url'))).toBe(true);
  });
});

describe('reconcileIssueReportsWithGithub', () => {
  const row = (overrides) => ({
    id: 1,
    status: 'PLANNED',
    priority: 'LOW',
    duplicateOfId: null,
    githubIssueNumber: 7,
    peopleAffected: 3,
    ...overrides,
  });

  const fakeGql = (reports) => {
    const updates = [];
    return {
      updates,
      async request(query, variables) {
        if (query.includes('ReconcileLinkedIssueReports')) return { IssueReport: reports };
        updates.push(variables);
        return { update_IssueReport_by_pk: { id: variables.id } };
      },
    };
  };

  /** A GitHub with issues by number (null: deleted) and issue bodies. */
  const fakeGithub = (issues) => {
    const patches = [];
    return {
      patches,
      config: { owner: 'eduhub-org', repo: 'eduhub', projectNumber: 4 },
      async graphql(_query, { number }) {
        const i = issues[number];
        if (!i) return { repository: { issue: null } };
        return {
          repository: {
            issue: {
              id: `I_${number}`,
              number,
              state: i.open ? 'OPEN' : 'CLOSED',
              stateReason: i.stateReason ?? null,
              repository: { nameWithOwner: i.repo ?? 'eduhub-org/eduhub' },
              duplicateOf: null,
              projectItems: { nodes: i.column ? [{ id: 'PVTI', project: { number: 4, owner: { login: 'eduhub-org' } }, fieldValueByName: { name: i.column } }] : [] },
            },
          },
        };
      },
      async rest(method, path, body) {
        if (method === 'GET') return { body: issues[Number(path.split('/').pop())].body ?? null };
        patches.push({ path, body });
        return {};
      },
    };
  };

  it('is skipped until the App is configured', async () => {
    await expect(reconcileIssueReportsWithGithub({}, logger, { read: settings({}) })).resolves.toEqual({
      success: true,
      skipped: 'The GitHub App is not configured',
    });
  });

  it('corrects statuses, unlinks gone issues and refreshes footers', async () => {
    const gql = fakeGql([row({ id: 1, githubIssueNumber: 7 }), row({ id: 2, githubIssueNumber: 8 }), row({ id: 3, githubIssueNumber: 9 })]);
    const github = fakeGithub({
      7: { open: false, stateReason: 'COMPLETED', body: 'Text' },
      8: null,
      9: { open: true, repo: 'someone/else' },
    });
    const result = await reconcileIssueReportsWithGithub({}, logger, { gql, github });
    expect(gql.updates).toEqual([
      { id: 1, set: { status: 'DONE' } },
      { id: 2, set: { githubIssueNumber: null } },
      { id: 3, set: { githubIssueNumber: null } },
    ]);
    expect(result).toMatchObject({ success: true, checked: 3, updated: 1, unlinked: 2 });
    expect(github.patches).toHaveLength(1);
    expect(github.patches[0].body.body).toContain('EduHub report #1 · priority: low · 3 people affected');
  });

  it('leaves an unchanged footer alone', async () => {
    const footer = renderFooter({ reportId: 1, priority: 'LOW', people: 3 });
    const gql = fakeGql([row()]);
    const github = fakeGithub({ 7: { open: true, column: 'Todo', body: `Text\n\n${footer}` } });
    await reconcileIssueReportsWithGithub({}, logger, { gql, github });
    expect(gql.updates).toEqual([]);
    expect(github.patches).toEqual([]);
  });

  it('keeps going after one report fails', async () => {
    const gql = fakeGql([row({ id: 1, githubIssueNumber: 7 }), row({ id: 2, githubIssueNumber: 8 })]);
    const github = fakeGithub({ 8: { open: false, stateReason: 'NOT_PLANNED', body: '' } });
    const failing = { ...github, graphql: async (q, v) => (v.number === 7 ? Promise.reject(new Error('GitHub 502')) : github.graphql(q, v)) };
    const result = await reconcileIssueReportsWithGithub({}, logger, { gql, github: failing });
    expect(gql.updates).toEqual([{ id: 2, set: { status: 'DECLINED' } }]);
    expect(result).toMatchObject({ success: false, failed: 1, checked: 1 });
  });
});
