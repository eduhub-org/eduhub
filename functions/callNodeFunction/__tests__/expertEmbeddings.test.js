import { jest } from '@jest/globals';
import {
  EMBEDDING_DIMENSIONS,
  cleanText,
  contentHash,
  embedText,
  embeddingConfig,
  fakeEmbedding,
  resetTokenCache,
  toVectorLiteral,
} from '../lib/expertEmbeddings.js';
import syncExpertEmbeddings from '../syncExpertEmbeddings/index.js';
import semanticExpertSearch from '../semanticExpertSearch/index.js';

const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
// Settings as lib/config.js's env() reads them.
const settings = (values) => (name) => values[name];
const cosine = (a, b) => a.reduce((sum, value, index) => sum + value * b[index], 0);

describe('embeddingConfig', () => {
  it('is off without a provider and keys the model by provider', () => {
    expect(embeddingConfig(settings({}))).toBeNull();
    expect(embeddingConfig(settings({ EMBEDDING_PROVIDER: 'vertex', EMBEDDING_LOCATION: 'europe-west3' }))).toMatchObject({
      modelKey: 'vertex:gemini-embedding-001',
      minSimilarity: 0.6,
    });
    expect(embeddingConfig(settings({ EMBEDDING_PROVIDER: 'fake', EXPERT_SEARCH_MIN_SIMILARITY: '0.3' })).minSimilarity).toBe(0.3);
  });
});

describe('text helpers', () => {
  it('strips markup and hashes like Postgres md5', () => {
    expect(cleanText('<p>Deep **Learning**</p>&nbsp;# Kurs')).toBe('Deep Learning Kurs');
    // Value of SELECT md5('Größe') in Postgres: the view and the function must agree on umlauts.
    expect(contentHash('Größe')).toBe('d248453369cf82a6a64617f1357089c5');
    expect(toVectorLiteral([0.5, -1])).toBe('[0.5,-1]');
  });

  it('gives texts sharing words a higher fake similarity', () => {
    const query = fakeEmbedding('machine learning');
    expect(query).toHaveLength(EMBEDDING_DIMENSIONS);
    expect(cosine(query, fakeEmbedding('Applied machine learning in industry'))).toBeGreaterThan(
      cosine(query, fakeEmbedding('Gardening for beginners'))
    );
  });
});

describe('Vertex AI provider', () => {
  beforeEach(() => resetTokenCache());

  it('requests one embedding with the task type and service-account token', async () => {
    const values = Array.from({ length: EMBEDDING_DIMENSIONS }, (_, index) => (index === 0 ? 3 : 0));
    const fetchImpl = jest.fn(async (url) => {
      if (String(url).endsWith('/token')) return { ok: true, json: async () => ({ access_token: 'tok', expires_in: 3600 }) };
      return { ok: true, json: async () => ({ predictions: [{ embeddings: { values } }] }) };
    });
    const config = embeddingConfig(settings({
      EMBEDDING_PROVIDER: 'vertex',
      EMBEDDING_LOCATION: 'europe-west3',
      EMBEDDING_PROJECT_ID: 'proj',
    }));

    const result = await embedText(config, '<b>KI</b> im Mittelstand', 'RETRIEVAL_QUERY', { fetchImpl });

    expect(result[0]).toBe(1);
    const [url, options] = fetchImpl.mock.calls[1];
    expect(url).toBe(
      'https://europe-west3-aiplatform.googleapis.com/v1/projects/proj/locations/europe-west3/publishers/google/models/gemini-embedding-001:predict'
    );
    expect(options.headers.Authorization).toBe('Bearer tok');
    expect(JSON.parse(options.body)).toEqual({
      instances: [{ content: 'KI im Mittelstand', task_type: 'RETRIEVAL_QUERY' }],
      parameters: { outputDimensionality: EMBEDDING_DIMENSIONS, autoTruncate: true },
    });
  });
});

describe('syncExpertEmbeddings', () => {
  it('does nothing while semantic search is off', async () => {
    const gql = { request: jest.fn() };
    expect(await syncExpertEmbeddings({}, logger, { gql, read: settings({}) })).toMatchObject({ success: true });
    expect(gql.request).not.toHaveBeenCalled();
  });

  // A fake database: sources stop needing an embedding once one was stored for them.
  const fakeGql = (sources) => {
    const pending = [...sources];
    return {
      request: jest.fn(async (query, variables) => {
        if (query.includes('delete_ExpertRoleEmbedding')) return { delete_ExpertRoleEmbedding: { affected_rows: 2 } };
        // The project pass (covered in projectEmbeddings.test.js) finds nothing to do here.
        if (query.includes('delete_ProjectEmbedding')) return { delete_ProjectEmbedding: { affected_rows: 0 } };
        if (query.includes('ProjectSourcesToEmbed')) {
          return { ProjectEmbeddingSource: [], ProjectEmbeddingSource_aggregate: { aggregate: { count: 0 } } };
        }
        if (query.includes('ExpertRoleSourcesToEmbed')) {
          return {
            ExpertRoleSource: pending.slice(0, variables.limit),
            ExpertRoleSource_aggregate: { aggregate: { count: pending.length } },
          };
        }
        const { sourceType, sourceId } = variables.object;
        pending.splice(pending.findIndex((source) => source.sourceType === sourceType && source.sourceId === sourceId), 1);
        return { insert_ExpertRoleEmbedding_one: { id: 1 } };
      }),
    };
  };

  it('drops stale vectors and embeds new or changed sources', async () => {
    const gql = fakeGql([{ sourceType: 'COURSE', sourceId: 7, text: 'Deep Learning', contentHash: 'h' }]);

    const result = await syncExpertEmbeddings({}, logger, { gql, read: settings({ EMBEDDING_PROVIDER: 'fake' }) });

    expect(result).toEqual({
      success: true,
      expertRoles: { deleted: 2, embedded: 1, failed: 0, remaining: 0 },
      projects: { deleted: 0, embedded: 0, failed: 0, remaining: 0 },
    });
    const callTo = (name) => gql.request.mock.calls.find(([query]) => query.includes(name));
    expect(callTo('delete_ExpertRoleEmbedding')[1]).toEqual({ model: 'fake:word-hash-768' });
    const upsert = callTo('insert_ExpertRoleEmbedding_one')[1].object;
    expect(upsert).toMatchObject({ sourceType: 'COURSE', sourceId: 7, model: 'fake:word-hash-768', contentHash: 'h' });
    expect(upsert.embedding.startsWith('[')).toBe(true);
  });

  it('keeps embedding batches until nothing is left, skipping texts that fail', async () => {
    const sources = Array.from({ length: 250 }, (_, index) => ({
      sourceType: 'SESSION',
      sourceId: index,
      text: index === 3 ? '' : `Session ${index} about machine learning`,
      contentHash: `h${index}`,
    }));

    const result = await syncExpertEmbeddings({}, logger, { gql: fakeGql(sources), read: settings({ EMBEDDING_PROVIDER: 'fake' }) });

    expect(result).toMatchObject({
      success: false,
      expertRoles: { deleted: 2, embedded: 249, failed: 1, remaining: 1 },
    });
  });

  it('stops starting new groups once its time budget is used up', async () => {
    const sources = Array.from({ length: 250 }, (_, index) => ({
      sourceType: 'COURSE',
      sourceId: index,
      text: `Course ${index}`,
      contentHash: `h${index}`,
    }));
    // Time passes while embeddings are written (10 s per text), not only when the clock is read.
    let clock = 0;
    const gql = fakeGql(sources);
    const request = gql.request;
    gql.request = jest.fn(async (query, variables) => {
      if (query.includes('insert_ExpertRoleEmbedding_one')) clock += 10_000;
      return request(query, variables);
    });

    const result = await syncExpertEmbeddings({}, logger, {
      gql,
      read: settings({ EMBEDDING_PROVIDER: 'fake' }),
      now: () => clock,
      timeBudgetMs: 120_000,
    });

    // Groups of 4 start at 0, 40, 80 s; at 120 s no further group starts.
    expect(result.expertRoles).toMatchObject({ embedded: 12, remaining: 238 });
  });
});

describe('semanticExpertSearch', () => {
  const request = (role, query = 'deep learning') => ({
    body: { session_variables: { 'x-hasura-role': role }, input: { query } },
  });

  it('only answers admins and org admins', async () => {
    const gql = { request: jest.fn() };
    expect(await semanticExpertSearch(request('user'), logger, { gql, read: settings({ EMBEDDING_PROVIDER: 'fake' }) })).toMatchObject({
      success: false,
      matches: [],
    });
    expect(gql.request).not.toHaveBeenCalled();
  });

  it('reports itself disabled without a provider and skips very short searches', async () => {
    const gql = { request: jest.fn() };
    expect(await semanticExpertSearch(request('admin'), logger, { gql, read: settings({}) })).toEqual({
      success: true,
      enabled: false,
      matches: [],
    });
    expect(
      await semanticExpertSearch(request('org_admin', 'ki'), logger, { gql, read: settings({ EMBEDDING_PROVIDER: 'fake' }) })
    ).toEqual({ success: true, enabled: true, matches: [] });
    expect(gql.request).not.toHaveBeenCalled();
  });

  it('finds nothing for a search without words long enough to embed', async () => {
    const gql = { request: jest.fn() };
    expect(
      await semanticExpertSearch(request('admin', 'AI ML UX'), logger, { gql, read: settings({ EMBEDDING_PROVIDER: 'fake' }) })
    ).toEqual({ success: true, enabled: true, matches: [] });
    expect(gql.request).not.toHaveBeenCalled();
  });

  it("limits an org admin's matches to their organizations before the match limit", async () => {
    const gql = {
      request: jest.fn(async (query) =>
        query.includes('ExpertSearchOrganizations')
          ? { OrganizationAdmin: [{ organizationId: 4 }, { organizationId: 9 }, { organizationId: 4 }] }
          : { match_expert_roles: [] }
      ),
    };
    const orgAdmin = request('org_admin');
    orgAdmin.body.session_variables['x-hasura-user-id'] = 'u-1';

    await semanticExpertSearch(orgAdmin, logger, { gql, read: settings({ EMBEDDING_PROVIDER: 'fake' }) });

    expect(gql.request.mock.calls[0][1]).toEqual({ userId: 'u-1' });
    expect(gql.request.mock.calls[1][1]).toMatchObject({ organizationIds: '{4,9}' });
  });

  it('returns the matched sources for the model in use', async () => {
    const matches = [{ sourceType: 'SESSION', sourceId: 3, similarity: 0.7 }];
    const gql = { request: jest.fn(async () => ({ match_expert_roles: matches })) };

    const result = await semanticExpertSearch(request('admin'), logger, { gql, read: settings({ EMBEDDING_PROVIDER: 'fake' }) });

    expect(result).toEqual({ success: true, enabled: true, matches });
    expect(gql.request.mock.calls[0][1]).toMatchObject({
      model: 'fake:word-hash-768',
      minSimilarity: 0.2,
      count: 200,
      organizationIds: null,
    });
  });
});
