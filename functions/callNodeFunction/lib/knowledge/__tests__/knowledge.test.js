import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { chunkCode, chunkMarkdown, headingId, parseFrontMatter } from '../chunk.js';
import { DENIED_PATHS, SECRET_PATTERNS, findSecrets, redactEmails, sourceTypeOf } from '../safety.js';
import { collectRepoPassages, fetchGitbookPassages, listFiles, manualUrl, resolveManualLinks } from '../sources.js';
import { rankPassages } from '../rank.js';
import { buildKnowledgeIndex } from '../build.js';
import { embeddingConfig } from '../../expertEmbeddings.js';
import searchKnowledge from '../../../searchKnowledge/index.js';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const fakeConfig = embeddingConfig((name) => ({ EMBEDDING_PROVIDER: 'fake' })[name]);

// Planted values are assembled at runtime so this file itself never matches the secret scan.
const STRIPE_KEY = ['sk', 'live', 'a1B2c3D4e5F6g7H8i9J0kLmN'].join('_');
const PRIVATE_KEY = ['-----BEGIN', 'RSA PRIVATE KEY-----\nMIIEow\n-----END RSA PRIVATE KEY-----'].join(' ');

/** A small checkout with every kind of source, and files that must never be indexed. */
const writeFixtureRepo = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'knowledge-repo-'));
  const files = {
    'CONTEXT.md': '# EduHub\n\n## Language\n\n**Waitlist**:\nPeople waiting for a Place in a full Course.\n',
    'frontend-nx/apps/edu-hub/locales/de.json': JSON.stringify(
      {
        course: { errors: { full: 'Der Kurs ist leider voll belegt' }, apply: 'Jetzt bewerben' },
        assistant: { errors: { RATE_LIMITED_SHORT: 'Bitte warte kurz und frag dann weiter' } },
      },
      null,
      2
    ),
    'frontend-nx/apps/edu-hub/locales/en.json': JSON.stringify(
      { course: { errors: { full: 'Unfortunately the course is fully booked' }, apply: 'Apply now' } },
      null,
      2
    ),
    'frontend-nx/apps/edu-hub/components/ApplyButton.tsx': [
      "import { useTranslations } from 'next-intl';",
      '',
      '/** Shows the apply button, or why one cannot apply. */',
      'export const ApplyButton = ({ isFull }: { isFull: boolean }) => {',
      "  const t = useTranslations('course');",
      "  if (isFull) return <p>{t('errors.full')}</p>;",
      "  return <button>{t('apply')}</button>;",
      '};',
      '',
      '// Contact for questions: maria.mustermann@gmail.com or edu-support@opencampus.sh',
      'export const contact = true;',
    ].join('\n'),
    'frontend-nx/apps/edu-hub/lib/payment.ts': `export const stripeKey = '${STRIPE_KEY}';\n`,
    'functions/callNodeFunction/sendMail/index.js': 'export const send = () => "sent";\n',
    'frontend-nx/apps/edu-hub/lib/assistant/limits.ts':
      "export const check = (count: number) => (count > 20 ? { code: 'RATE_LIMITED_SHORT' } : null);\n",
    'backend/metadata/databases/default/tables/public_Course.yaml':
      'table:\n  name: Course\n  schema: public\nselect_permissions:\n  - role: user\n    permission:\n      columns: [id, title]\n',
    'docs/manual/de/participants/registration.md': [
      '---',
      'title: Anmelden und bewerben',
      'slug: participants/registration',
      'audience: [participant]',
      'language: de',
      'summary: Wie Du Dich für einen Kurs bewirbst.',
      '---',
      '',
      '## Wenn der Kurs voll ist',
      '',
      'Ist ein Kurs voll belegt, kommst Du auf die Warteliste.',
    ].join('\n'),
    'docs/manual/de/index.md':
      '---\ntitle: Hilfe\nslug:\nlanguage: de\n---\n\n## Erste Schritte\n\nLies [Anmelden](participants/registration.md#wenn-der-kurs-voll-ist).\n',
    'docs/manual/en/participants/registration.md':
      '---\ntitle: Registering\nslug: participants/registration\nlanguage: en\n---\n\n## When the course is full\n\nYou join the waitlist.\n',
    // Never indexed:
    '.env': `HASURA_ADMIN_SECRET=${STRIPE_KEY}\n`,
    'frontend-nx/apps/edu-hub/.env.local': 'NEXTAUTH_SECRET=abc\n',
    'frontend-nx/apps/edu-hub/config/.env.production': 'X=1\n',
    'backend/seeds/default/initial_seeds.sql': "INSERT INTO \"User\" VALUES ('real.person@gmail.com');\n",
    'backend/migrations/default/1_data/up.sql': "INSERT INTO \"User\" VALUES ('x');\n",
    'frontend-nx/apps/edu-hub/components/__tests__/ApplyButton.test.tsx': 'test();\n',
    'frontend-nx/apps/edu-hub/components/ApplyButton.spec.tsx': 'test();\n',
    'frontend-nx/apps/edu-hub/queries/__generated__/Course.ts': 'export type X = 1;\n',
    'frontend-nx/apps/edu-hub/lib/assistant/credentials.ts': 'export const token = 1;\n',
    'functions/callNodeFunction/scripts/backfill.js': 'run();\n',
    'functions/callNodeFunction/node_modules/pkg/index.js': 'module.exports = 1;\n',
    'infrastructure/application/terraform.tfvars': 'secret = "x"\n',
    'keycloak/realm.json': '{}\n',
    'certs/server.pem': `${PRIVATE_KEY}\n`,
  };
  Object.entries(files).forEach(([file, content]) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
  });
  return root;
};

/** Hasura over the knowledge tables, with match_knowledge as Postgres computes it. */
const createKnowledgeStore = ({ failInsertAfter = Infinity } = {}) => {
  const state = { chunks: [], indexes: [], nextId: 1, inserts: 0 };
  const vector = (literal) => JSON.parse(literal);
  const cosine = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
  const request = jest.fn(async (query, variables = {}) => {
    const operation = /(?:query|mutation)\s+(\w+)/.exec(query)[1];
    switch (operation) {
      case 'KnowledgeIndexState':
        return { KnowledgeIndex: state.indexes };
      case 'DeleteUnfinishedKnowledgeRuns': {
        const before = state.chunks.length;
        state.chunks = state.chunks.filter((c) => variables.activeIds.includes(c.indexRunId));
        return { delete_KnowledgeChunk: { affected_rows: before - state.chunks.length } };
      }
      case 'ExistingKnowledgeEmbeddings': {
        const seen = new Map();
        state.chunks
          .filter((c) => c.model === variables.model && variables.hashes.includes(c.contentHash))
          .forEach((c) => seen.set(c.contentHash, c.embedding));
        return { KnowledgeChunk: [...seen].map(([contentHash, embedding]) => ({ contentHash, embedding })) };
      }
      case 'InsertKnowledgeChunks':
        state.inserts += 1;
        if (state.inserts > failInsertAfter) throw new Error('connection reset');
        variables.objects.forEach((object) => state.chunks.push({ id: state.nextId++, ...object }));
        return { insert_KnowledgeChunk: { affected_rows: variables.objects.length } };
      case 'ActivateKnowledgeIndex':
        state.indexes = [variables.index];
        state.chunks = state.chunks.filter((c) => c.indexRunId === variables.runId);
        return {};
      case 'KnowledgeAskerOrganizations':
        return state.asker ?? { User_by_pk: null, OrganizationAdmin: [], CourseEnrollment: [], Course_by_pk: null };
      case 'MatchKnowledge': {
        const query = vector(variables.embedding);
        const organizations = variables.organizationIds.replace(/[{}]/g, '').split(',').filter(Boolean).map(Number);
        const active = new Set(state.indexes.map((index) => index.id));
        const matches = state.chunks
          .filter((c) => active.has(c.indexRunId) && c.model === variables.model)
          .filter((c) => c.organizationId == null || organizations.includes(c.organizationId))
          .map((c) => ({ ...c, similarity: cosine(vector(c.embedding), query) }))
          .filter((c) => c.similarity >= variables.minSimilarity)
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, variables.count);
        return { match_knowledge: matches };
      }
      default:
        throw new Error(`Unexpected operation ${operation}`);
    }
  });
  return { state, gql: { request } };
};

const asUser = (input, role = 'user') => ({
  body: { session_variables: { 'x-hasura-role': role, 'x-hasura-user-id': 'u-1' }, input },
});
const settings = (values) => (name) => values[name];

describe('chunking', () => {
  it('builds heading anchors as the manual renders them', () => {
    expect(headingId('Wenn der Kurs voll ist')).toBe('wenn-der-kurs-voll-ist');
    expect(headingId('Größe & Übungen: „Café“')).toBe('groesse-uebungen-cafe');
  });

  it('reads flat front matter', () => {
    const { data, body } = parseFrontMatter('---\ntitle: "Kurs anlegen"\naudience: [organizer, admin]\norder: 10\n---\n# Hi');
    expect(data).toEqual({ title: 'Kurs anlegen', audience: ['organizer', 'admin'], order: '10' });
    expect(body).toBe('# Hi');
  });

  it('splits documents by heading, keeps the trail and ignores headings in code fences', () => {
    const chunks = chunkMarkdown('# Page\nIntro\n## A\nText A\n```\n## not a heading\n```\n### A1\nText A1\n## B\nText B', {});
    expect(chunks.map((c) => [c.title, c.anchor])).toEqual([
      ['Page', null],
      ['Page › A', 'a'],
      ['Page › A › A1', 'a1'],
      ['Page › B', 'b'],
    ]);
    expect(chunks[1].text).toContain('## not a heading');
  });

  it('splits long sections with an overlap', () => {
    const paragraph = 'Wort '.repeat(100).trim();
    const chunks = chunkMarkdown(`## Long\n${Array(8).fill(paragraph).join('\n\n')}`, { maxChars: 1500, overlap: 200 });
    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((chunk) => expect(chunk.text.length).toBeLessThanOrEqual(1500));
  });

  it('splits code by top-level declaration and keeps line ranges', () => {
    const body = (name) => `export function ${name}() {\n${'  doSomething();\n'.repeat(70)}}\n`;
    const code = `import x from 'y';\n\n${body('first')}\n// About second\n${body('second')}`;
    const chunks = chunkCode(code, 'lib/a.ts', { maxChars: 2000 });
    expect(chunks.map((c) => c.names)).toEqual([['first'], ['second']]);
    expect(chunks[1].text.startsWith('// About second')).toBe(true);
    expect(code.split('\n').slice(chunks[1].startLine - 1, chunks[1].endLine).join('\n').trim()).toBe(chunks[1].text);
  });

  it('joins tiny pieces to the passage before them', () => {
    const big = `export const Big = () => {\n${'  line();\n'.repeat(250)}};\n`;
    const chunks = chunkCode(`${big}export default Big;\n`, 'components/Big.tsx');
    expect(chunks[chunks.length - 1].text.endsWith('export default Big;')).toBe(true);
    chunks.forEach((chunk) => expect(chunk.names).toContain('Big'));
  });
});

describe('what may be indexed', () => {
  it.each([
    ['CONTEXT.md', 'GLOSSARY'],
    ['docs/manual/de/participants/registration.md', 'MANUAL'],
    ['frontend-nx/apps/edu-hub/locales/de.json', 'LOCALE'],
    ['frontend-nx/apps/stujo/locales/en.json', 'LOCALE'],
    ['frontend-nx/apps/edu-hub/components/common/Button.tsx', 'CODE'],
    ['functions/callPythonFunction/main.py', 'CODE'],
    ['backend/metadata/databases/default/tables/public_Course.yaml', 'CODE'],
    ['backend/metadata/actions.graphql', 'CODE'],
  ])('indexes %s as %s', (file, type) => expect(sourceTypeOf(file)).toBe(type));

  it.each([
    '.env',
    'frontend-nx/.env.local',
    'functions/callNodeFunction/.env.example',
    'backend/seeds/default/initial_seeds.sql',
    'backend/migrations/default/1_x/up.sql',
    'functions/callNodeFunction/__tests__/registry.test.js',
    'frontend-nx/apps/edu-hub/components/Button.test.tsx',
    'frontend-nx/apps/edu-hub/queries/__generated__/x.ts',
    'frontend-nx/apps/edu-hub/lib/assistant/credentials.ts',
    'functions/callNodeFunction/scripts/backfill-matrix-handles.js',
    'functions/callNodeFunction/node_modules/x/index.js',
    'infrastructure/application/00_variables.tf',
    'keycloak/import/realm.json',
    'docker-compose.yml',
    'backend/metadata/databases/databases.yaml',
    'README.md',
  ])('never indexes %s', (file) => expect(sourceTypeOf(file)).toBeNull());

  it('recognizes secrets and replaces personal e-mail addresses', () => {
    expect(findSecrets(`key = '${STRIPE_KEY}'`)).toEqual(['Stripe key']);
    expect(findSecrets(PRIVATE_KEY)).toEqual(['private key']);
    expect(findSecrets("const password = 'correct-horse-battery'")).toEqual(['hard-coded credential']);
    expect(findSecrets('postgres://hasura:s3cr3tpw@db:5432/x')).toEqual(['URL with password']);
    expect(findSecrets("const secret = process.env.HASURA_ADMIN_SECRET; const label = t('password');")).toEqual([]);
    expect(redactEmails('Mail maria@gmail.com or edu-support@opencampus.sh')).toBe('Mail [email] or edu-support@opencampus.sh');
  });
});

describe('collecting passages from a checkout', () => {
  let root;
  let passages;
  beforeAll(() => {
    root = writeFixtureRepo();
    passages = collectRepoPassages(root, { release: 'v2.20.0', logger });
  });
  afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

  it('only takes allowlisted files', () => {
    const paths = [...new Set(passages.map((p) => p.path))].sort();
    expect(paths).toEqual([
      'CONTEXT.md',
      'backend/metadata/databases/default/tables/public_Course.yaml',
      'docs/manual/de/index.md',
      'docs/manual/de/participants/registration.md',
      'docs/manual/en/participants/registration.md',
      'frontend-nx/apps/edu-hub/components/ApplyButton.tsx',
      'frontend-nx/apps/edu-hub/lib/assistant/limits.ts',
      'frontend-nx/apps/edu-hub/locales/de.json',
      'frontend-nx/apps/edu-hub/locales/en.json',
      'functions/callNodeFunction/sendMail/index.js',
    ]);
    expect(listFiles(root)).not.toContain('functions/callNodeFunction/node_modules/pkg/index.js');
  });

  it('drops a passage holding a secret and reports only its path', () => {
    expect(passages.some((p) => p.content.includes(STRIPE_KEY))).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith(expect.any(String), {
      path: 'frontend-nx/apps/edu-hub/lib/payment.ts',
      secrets: ['Stripe key'],
    });
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain(STRIPE_KEY);
  });

  it('replaces personal e-mail addresses but keeps the platform contact', () => {
    const code = passages.find((p) => p.path.endsWith('ApplyButton.tsx')).content;
    expect(code).not.toContain('maria.mustermann@gmail.com');
    expect(code).toContain('[email]');
    expect(code).toContain('edu-support@opencampus.sh');
  });

  it('links manual sections to /help, code to the released tag, and code to the texts it shows', () => {
    const de = passages.find((p) => p.path === 'docs/manual/de/participants/registration.md');
    expect(de).toMatchObject({
      sourceType: 'MANUAL',
      language: 'de',
      title: 'Anmelden und bewerben › Wenn der Kurs voll ist',
      url: '/help/participants/registration#wenn-der-kurs-voll-ist',
    });
    expect(de.content).toContain('Wie Du Dich für einen Kurs bewirbst.');
    expect(passages.find((p) => p.path === 'docs/manual/en/participants/registration.md').url).toBe(
      '/en/help/participants/registration#when-the-course-is-full'
    );
    expect(manualUrl('de', 'participants/index')).toBe('/help/participants');
    // The start page has an empty slug; links between pages become /help links.
    const start = passages.find((p) => p.path === 'docs/manual/de/index.md');
    expect(start.url).toBe('/help#erste-schritte');
    expect(start.content).toContain('[Anmelden](/help/participants/registration#wenn-der-kurs-voll-ist)');
    expect(resolveManualLinks('[S](../organizers/sessions.md)', 'en', 'participants/registration')).toBe(
      '[S](/en/help/organizers/sessions)'
    );

    const code = passages.find((p) => p.path.endsWith('ApplyButton.tsx'));
    expect(code.url).toMatch(/^https:\/\/github\.com\/eduhub-org\/eduhub\/blob\/v2\.20\.0\/frontend-nx\/apps\/edu-hub\/components\/ApplyButton\.tsx#L1-L\d+$/);
    expect(code.content).toContain('course.errors.full: Der Kurs ist leider voll belegt / Unfortunately the course is fully booked');
    // An error code is looked up dynamically (`assistant.errors.${code}`); its text still links.
    expect(passages.find((p) => p.path.endsWith('limits.ts')).content).toContain(
      'assistant.errors.RATE_LIMITED_SHORT: Bitte warte kurz und frag dann weiter'
    );
    const locale = passages.find((p) => p.sourceType === 'LOCALE' && p.language === 'de' && p.content.includes('course.'));
    expect(locale.content).toContain('course.errors.full: Der Kurs ist leider voll belegt');
  });
});

describe('the repository itself', () => {
  // The automated check of issue #2195: whatever the index would take from this checkout holds no
  // secrets, env files, seeds or migrations.
  const passages = collectRepoPassages(REPO_ROOT, { release: 'test' });

  it('indexes the glossary, the locales and code', () => {
    const types = new Set(passages.map((p) => p.sourceType));
    ['GLOSSARY', 'LOCALE', 'CODE'].forEach((type) => expect(types).toContain(type));
  });

  it('holds no secrets and no denied files', () => {
    passages.forEach((passage) => {
      expect(DENIED_PATHS.filter((pattern) => pattern.test(passage.path))).toEqual([]);
      const found = SECRET_PATTERNS.filter(({ pattern }) => pattern.test(passage.content)).map(({ name }) => name);
      if (found.length) throw new Error(`${passage.path} holds ${found.join(', ')}`);
    });
  });
});

describe('ranking', () => {
  const match = (id, sourceType, similarity, file = `f${id}`) => ({
    id,
    sourceType,
    similarity,
    path: file,
    title: file,
    url: `/${file}`,
    content: 'x',
  });

  it('puts rules and the manual before glossary, locales and code at similar similarity', () => {
    const ranked = rankPassages([
      match(1, 'CODE', 0.7),
      match(2, 'LOCALE', 0.68),
      match(3, 'MANUAL', 0.66),
      match(4, 'ORGANIZATION_RULES', 0.65),
      match(5, 'GLOSSARY', 0.67),
    ]);
    expect(ranked.map((p) => p.sourceType)).toEqual(['ORGANIZATION_RULES', 'MANUAL', 'LOCALE', 'GLOSSARY', 'CODE']);
  });

  it('still puts much closer code first and caps passages per file', () => {
    const ranked = rankPassages([
      match(1, 'MANUAL', 0.4),
      match(2, 'CODE', 0.9, 'a.ts'),
      match(3, 'CODE', 0.89, 'a.ts'),
      match(4, 'CODE', 0.88, 'a.ts'),
    ]);
    expect(ranked.map((p) => p.sourceType)).toEqual(['CODE', 'CODE', 'MANUAL']);
    expect(ranked[0]).toMatchObject({ url: '/a.ts', score: 0.9 });
  });
});

describe('building the index', () => {
  const passage = (n) => ({
    sourceType: 'CODE',
    title: `file${n}.ts`,
    path: `file${n}.ts`,
    url: `/file${n}`,
    content: `export const value${n} = compute${n}(input);`,
  });

  it('switches to the new build at once and reuses unchanged embeddings', async () => {
    const { state, gql } = createKnowledgeStore();
    const fetchImpl = jest.fn();
    await buildKnowledgeIndex({ passages: [passage(1), passage(2)], gql, config: fakeConfig, release: 'v1', runId: 'v1@a', logger });
    expect(state.indexes).toEqual([expect.objectContaining({ id: 'v1@a', release: 'v1', chunkCount: 2 })]);

    const summary = await buildKnowledgeIndex({
      passages: [passage(1), passage(2), passage(3)],
      gql,
      config: fakeConfig,
      release: 'v2',
      runId: 'v2@b',
      fetchImpl,
      logger,
    });
    expect(summary).toMatchObject({ chunks: 3, embedded: 1, reused: 2 });
    expect(new Set(state.chunks.map((c) => c.indexRunId))).toEqual(new Set(['v2@b']));
    expect(state.indexes.map((index) => index.id)).toEqual(['v2@b']);
  });

  it('keeps the previous index when a build fails', async () => {
    const { state, gql } = createKnowledgeStore({ failInsertAfter: 1 });
    await buildKnowledgeIndex({ passages: [passage(1)], gql, config: fakeConfig, release: 'v1', runId: 'v1@a', logger });
    const many = Array.from({ length: 150 }, (_, i) => passage(i + 10));
    await expect(
      buildKnowledgeIndex({ passages: many, gql, config: fakeConfig, release: 'v2', runId: 'v2@b', logger })
    ).rejects.toThrow('connection reset');
    expect(state.indexes.map((index) => index.id)).toEqual(['v1@a']);

    // Searches only see the live build, also while the leftovers of the failed one are stored.
    const result = await searchKnowledge(asUser({ query: 'value1 compute1 input' }), logger, {
      gql,
      read: settings({ EMBEDDING_PROVIDER: 'fake' }),
    });
    expect(result.passages.map((p) => p.url)).toEqual(['/file1']);
  });

  it('refuses a build far smaller than the live one unless forced', async () => {
    const { state, gql } = createKnowledgeStore();
    const many = Array.from({ length: 10 }, (_, i) => passage(i));
    await buildKnowledgeIndex({ passages: many, gql, config: fakeConfig, release: 'v1', runId: 'v1@a', logger });
    await expect(
      buildKnowledgeIndex({ passages: [passage(1)], gql, config: fakeConfig, release: 'v2', runId: 'v2@b', logger })
    ).rejects.toThrow('not replacing it');
    expect(state.indexes[0].id).toBe('v1@a');
    await buildKnowledgeIndex({ passages: [passage(1)], gql, config: fakeConfig, release: 'v2', runId: 'v2@c', logger, force: true });
    expect(state.indexes[0].id).toBe('v2@c');
  });
});

describe('fetching the organization rules from GitBook', () => {
  it('reads the pages listed in llms.txt, tags them with the organization and links the page', async () => {
    const pages = {
      'https://opencampus.gitbook.io/faq/llms.txt':
        '# FAQ\n- [Termine](https://opencampus.gitbook.io/faq/readme/termine.md)\n- [Elsewhere](https://evil.example.com/x.md)\n',
      'https://opencampus.gitbook.io/faq/readme/termine.md': '# Termine\n\n## Fehltermine\n\nDu darfst höchstens zwei Termine verpassen.\n',
    };
    const fetchImpl = jest.fn(async (url) => ({ ok: url in pages, status: url in pages ? 200 : 404, text: async () => pages[url] }));
    const passages = await fetchGitbookPassages('https://opencampus.gitbook.io/faq/', { organizationId: 7, fetchImpl, logger });
    expect(fetchImpl).not.toHaveBeenCalledWith('https://evil.example.com/x.md', expect.anything());
    expect(passages).toEqual([
      expect.objectContaining({
        sourceType: 'ORGANIZATION_RULES',
        organizationId: 7,
        title: 'Termine › Fehltermine',
        url: 'https://opencampus.gitbook.io/faq/readme/termine',
        path: 'readme/termine',
      }),
    ]);
  });
});

describe('searchKnowledge', () => {
  let root;
  let store;
  const read = settings({ EMBEDDING_PROVIDER: 'fake' });

  beforeAll(async () => {
    root = writeFixtureRepo();
    store = createKnowledgeStore();
    const rules = [
      {
        sourceType: 'ORGANIZATION_RULES',
        organizationId: 7,
        language: 'de',
        title: 'Warteliste',
        path: 'readme/warteliste',
        url: 'https://opencampus.gitbook.io/faq/readme/warteliste',
        content: 'Ist der Kurs voll belegt, kommst Du auf die Warteliste und rückst nach.',
      },
    ];
    await buildKnowledgeIndex({
      passages: [...rules, ...collectRepoPassages(root, { release: 'v2.20.0' })],
      gql: store.gql,
      config: fakeConfig,
      release: 'v2.20.0',
      runId: 'v2.20.0@a',
      logger,
    });
  });
  afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

  it('finds the code that shows an error message and its locale key', async () => {
    const result = await searchKnowledge(asUser({ query: 'Der Kurs ist leider voll belegt' }), logger, { gql: store.gql, read });
    expect(result.success).toBe(true);
    const types = result.passages.map((p) => p.sourceType);
    expect(types).toContain('LOCALE');
    expect(types).toContain('CODE');
    const code = result.passages.find((p) => p.sourceType === 'CODE');
    expect(code.url).toContain('/blob/v2.20.0/frontend-nx/apps/edu-hub/components/ApplyButton.tsx#L');
    expect(code.content).toContain("t('errors.full')");
    expect(result.passages.find((p) => p.sourceType === 'LOCALE').content).toContain('course.errors.full');
    // Ranked, highest first; every passage links its source.
    const scores = result.passages.map((p) => p.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    result.passages.forEach((p) => expect(p.url).toBeTruthy());
  });

  it('ranks the manual before code for a how-to question', async () => {
    const result = await searchKnowledge(asUser({ query: 'Was passiert, wenn der Kurs voll ist?' }), logger, { gql: store.gql, read });
    expect(result.passages[0]).toMatchObject({ sourceType: 'MANUAL', url: '/help/participants/registration#wenn-der-kurs-voll-ist' });
  });

  it('only returns organization rules of the asker\'s organizations or the course on the page', async () => {
    const question = asUser({ query: 'Kurs voll belegt Warteliste nachrücken' });
    const without = await searchKnowledge(question, logger, { gql: store.gql, read });
    expect(without.passages.map((p) => p.sourceType)).not.toContain('ORGANIZATION_RULES');

    store.state.asker = {
      User_by_pk: { organizationId: null },
      OrganizationAdmin: [],
      CourseEnrollment: [{ Course: { Program: { organizationId: 7 } } }],
      Course_by_pk: null,
    };
    const member = await searchKnowledge(question, logger, { gql: store.gql, read });
    expect(member.passages[0]).toMatchObject({ sourceType: 'ORGANIZATION_RULES', title: 'Warteliste' });
    delete store.state.asker;
  });

  it('asks Hasura for the course\'s organization only when a course is given', async () => {
    store.gql.request.mockClear();
    await searchKnowledge(asUser({ query: 'Warteliste', courseId: 12 }), logger, { gql: store.gql, read });
    expect(store.gql.request).toHaveBeenCalledWith(expect.stringContaining('KnowledgeAskerOrganizations'), {
      userId: 'u-1',
      courseId: 12,
      withCourse: true,
    });
  });

  it('is off without a provider, refuses anonymous callers and reports failures', async () => {
    expect(await searchKnowledge(asUser({ query: 'Warteliste' }), logger, { gql: store.gql, read: settings({}) })).toMatchObject({
      enabled: false,
      passages: [],
    });
    expect(await searchKnowledge(asUser({ query: 'Warteliste' }, 'anonymous'), logger, { gql: store.gql, read })).toMatchObject({
      success: false,
    });
    const broken = { request: jest.fn().mockRejectedValue(new Error('down')) };
    expect(await searchKnowledge(asUser({ query: 'Warteliste' }), logger, { gql: broken, read })).toMatchObject({
      success: false,
      enabled: true,
      error: 'The knowledge search is currently unavailable',
    });
  });
});
