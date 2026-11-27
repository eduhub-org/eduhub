import { jest } from '@jest/globals';
import syncExpertEmbeddings from '../syncExpertEmbeddings/index.js';
import semanticProjectSearch from '../semanticProjectSearch/index.js';

// Semantic project search (ADR 0009): the project pass of the nightly sync and the search action.

const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
// Settings as lib/config.js's env() reads them.
const settings = (values) => (name) => values[name];
const fake = settings({ EMBEDDING_PROVIDER: 'fake' });

describe('syncExpertEmbeddings project pass', () => {
  // A fake database with no Expert Role sources left to embed and the given projects pending.
  const fakeGql = (projects, { staleProjects = 0 } = {}) => {
    const pending = [...projects];
    return {
      request: jest.fn(async (query, variables) => {
        if (query.includes('delete_ExpertRoleEmbedding')) return { delete_ExpertRoleEmbedding: { affected_rows: 0 } };
        if (query.includes('delete_ProjectEmbedding')) return { delete_ProjectEmbedding: { affected_rows: staleProjects } };
        if (query.includes('ExpertRoleSourcesToEmbed')) {
          return { ExpertRoleSource: [], ExpertRoleSource_aggregate: { aggregate: { count: 0 } } };
        }
        if (query.includes('ProjectSourcesToEmbed')) {
          return {
            ProjectEmbeddingSource: pending.slice(0, variables.limit),
            ProjectEmbeddingSource_aggregate: { aggregate: { count: pending.length } },
          };
        }
        if (query.includes('insert_ProjectEmbedding_one')) {
          const { projectId } = variables.object;
          pending.splice(pending.findIndex((project) => project.projectId === projectId), 1);
          return { insert_ProjectEmbedding_one: { id: 1 } };
        }
        throw new Error(`Unexpected request: ${query}`);
      }),
    };
  };
  const callsTo = (gql, name) => gql.request.mock.calls.filter(([query]) => query.includes(name));

  it('embeds new or changed projects with the model in use', async () => {
    const gql = fakeGql([
      { projectId: 5, text: 'Solar boat\nAn electric boat', contentHash: 'h5' },
      { projectId: 6, text: 'Smart garden sensors', contentHash: 'h6' },
    ]);

    const result = await syncExpertEmbeddings({}, logger, { gql, read: fake });

    expect(result.success).toBe(true);
    expect(result.projects).toEqual({ deleted: 0, embedded: 2, failed: 0, remaining: 0 });
    const upserts = callsTo(gql, 'insert_ProjectEmbedding_one').map(([, variables]) => variables.object);
    expect(upserts.map((object) => object.projectId)).toEqual([5, 6]);
    expect(upserts[0]).toMatchObject({ projectId: 5, model: 'fake:word-hash-768', contentHash: 'h5' });
    expect(upserts[0].embedding.startsWith('[')).toBe(true);
    // Only projects the view marks as needing an embedding are read.
    expect(callsTo(gql, 'ProjectSourcesToEmbed')[0][0]).toContain('needsEmbedding');
  });

  it('drops vectors of another model; deleted projects take theirs along', async () => {
    const gql = fakeGql([], { staleProjects: 3 });

    const result = await syncExpertEmbeddings({}, logger, { gql, read: fake });

    expect(result.projects).toEqual({ deleted: 3, embedded: 0, failed: 0, remaining: 0 });
    expect(callsTo(gql, 'delete_ProjectEmbedding')[0][1]).toEqual({ model: 'fake:word-hash-768' });
  });

  it('skips a project that cannot be embedded and reports it', async () => {
    const gql = fakeGql([
      { projectId: 1, text: '', contentHash: 'h1' },
      { projectId: 2, text: 'Robotics lab', contentHash: 'h2' },
    ]);

    const result = await syncExpertEmbeddings({}, logger, { gql, read: fake });

    expect(result.success).toBe(false);
    expect(result.projects).toEqual({ deleted: 0, embedded: 1, failed: 1, remaining: 1 });
  });

  it('shares the time budget with the expert pass', async () => {
    const gql = fakeGql([{ projectId: 1, text: 'Robotics lab', contentHash: 'h1' }]);
    let clock = 0;
    const request = gql.request;
    // The expert pass used up the whole budget before the projects got their turn.
    gql.request = jest.fn(async (query, variables) => {
      if (query.includes('ExpertRoleSourcesToEmbed')) clock = 120_000;
      return request(query, variables);
    });

    const result = await syncExpertEmbeddings({}, logger, { gql, read: fake, now: () => clock, timeBudgetMs: 120_000 });

    expect(result.projects).toEqual({ deleted: 0, embedded: 0, failed: 0, remaining: null });
    expect(gql.request.mock.calls.some(([query]) => query.includes('insert_ProjectEmbedding_one'))).toBe(false);
  });
});

describe('semanticProjectSearch', () => {
  const request = (role, query = 'solar energy boat', userId) => ({
    body: { session_variables: { 'x-hasura-role': role, 'x-hasura-user-id': userId }, input: { query } },
  });

  it.each(['user', 'instructor', 'anonymous', undefined])('does not answer the role %s', async (role) => {
    const gql = { request: jest.fn() };
    expect(await semanticProjectSearch(request(role), logger, { gql, read: fake })).toMatchObject({
      success: false,
      enabled: false,
      matches: [],
    });
    expect(gql.request).not.toHaveBeenCalled();
  });

  it('reports itself disabled without a provider', async () => {
    const gql = { request: jest.fn() };
    expect(await semanticProjectSearch(request('admin'), logger, { gql, read: settings({}) })).toEqual({
      success: true,
      enabled: false,
      matches: [],
    });
    expect(gql.request).not.toHaveBeenCalled();
  });

  it('ignores searches shorter than three characters', async () => {
    const gql = { request: jest.fn() };
    expect(await semanticProjectSearch(request('org_admin', ' ki ', 'u-1'), logger, { gql, read: fake })).toEqual({
      success: true,
      enabled: true,
      matches: [],
    });
    expect(gql.request).not.toHaveBeenCalled();
  });

  it('searches every organization for admins', async () => {
    const matches = [{ projectId: 3, similarity: 0.7 }];
    const gql = { request: jest.fn(async () => ({ match_projects: matches })) };

    const result = await semanticProjectSearch(request('admin'), logger, { gql, read: fake });

    expect(result).toEqual({ success: true, enabled: true, matches });
    expect(gql.request).toHaveBeenCalledTimes(1);
    expect(gql.request.mock.calls[0][0]).toContain('match_projects');
    expect(gql.request.mock.calls[0][1]).toMatchObject({
      model: 'fake:word-hash-768',
      minSimilarity: 0.2,
      count: 200,
      courseOrganizationIds: null,
      eventOrganizationIds: null,
    });
  });

  it("passes an org admin's course and event organizations to match_projects separately", async () => {
    const gql = {
      request: jest.fn(async (query) =>
        query.includes('ProjectSearchOrganizations')
          ? {
              OrganizationAdmin: [
                { organizationId: 4, canManageCourses: true, canManageEvents: false },
                { organizationId: 9, canManageCourses: true, canManageEvents: true },
                { organizationId: 4, canManageCourses: true, canManageEvents: false },
                { organizationId: 7, canManageCourses: false, canManageEvents: true },
              ],
            }
          : { match_projects: [] }
      ),
    };

    await semanticProjectSearch(request('org_admin', 'solar boat', 'u-1'), logger, { gql, read: fake });

    const [grantsQuery, grantsVariables] = gql.request.mock.calls[0];
    expect(grantsVariables).toEqual({ userId: 'u-1' });
    expect(grantsQuery).toContain('canManageCourses');
    expect(grantsQuery).toContain('canManageEvents');
    expect(grantsQuery).not.toContain('canManageDegrees');
    const matchVariables = gql.request.mock.calls[1][1];
    expect(matchVariables).toMatchObject({ courseOrganizationIds: '{4,9}', eventOrganizationIds: '{9,7}' });
    expect(matchVariables).not.toHaveProperty('organizationIds');
  });

  it('gives an events-only org admin an empty course scope', async () => {
    const gql = {
      request: jest.fn(async (query) =>
        query.includes('ProjectSearchOrganizations')
          ? { OrganizationAdmin: [{ organizationId: 7, canManageCourses: false, canManageEvents: true }] }
          : { match_projects: [] }
      ),
    };

    await semanticProjectSearch(request('org_admin', 'solar boat', 'u-1'), logger, { gql, read: fake });

    expect(gql.request.mock.calls[1][1]).toMatchObject({ courseOrganizationIds: '{}', eventOrganizationIds: '{7}' });
  });

  it('finds nothing for an org admin without course or event grants', async () => {
    const gql = { request: jest.fn(async () => ({ OrganizationAdmin: [] })) };

    expect(await semanticProjectSearch(request('org_admin', 'solar boat', 'u-1'), logger, { gql, read: fake })).toEqual({
      success: true,
      enabled: true,
      matches: [],
    });
    expect(gql.request).toHaveBeenCalledTimes(1);
  });

  it('reports a failed search as unavailable', async () => {
    const gql = { request: jest.fn(async () => Promise.reject(new Error('down'))) };

    expect(await semanticProjectSearch(request('admin'), logger, { gql, read: fake })).toMatchObject({
      success: false,
      enabled: true,
      matches: [],
    });
  });
});
