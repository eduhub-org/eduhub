import type { JobTombstone } from './jobs';

const NOW = new Date('2026-10-19T12:00:00Z');
const PAST = '2026-10-01T00:00:00Z';
const FUTURE = '2026-11-01T00:00:00Z';

const tombstone = (overrides: Partial<JobTombstone> = {}): JobTombstone => ({
  status: 'EXPIRED',
  expiresAt: PAST,
  restrictedToOrganizationId: null,
  title: 'Werkstudent:in Marketing',
  type: 'WORKING_STUDENT',
  occupation: 'MARKETING_ADVERTISING',
  customCompany: null,
  Organization: { name: 'Beispiel GmbH' },
  ...overrides,
});

// hasura.ts reads API_URL at module load, so each test gets fresh modules
// after the environment is set.
const loadJobs = () => {
  jest.resetModules();
  process.env.API_URL = 'http://hasura.test/v1/graphql';
  return require('./jobs') as typeof import('./jobs');
};

describe('classifyUnavailableJob', () => {
  const { classifyUnavailableJob } = loadJobs();

  it.each([
    ['EXPIRED', PAST, 'expired'],
    ['ARCHIVED', FUTURE, 'expired'],
    // the nightly expire cron has not flipped the status yet
    ['PUBLISHED', PAST, 'expired'],
    ['DEACTIVATED', FUTURE, 'deactivated'],
    ['DEACTIVATED', null, 'deactivated'],
    ['DEACTIVATED', PAST, 'expired'],
    ['DRAFT', null, 'notFound'],
    ['PENDING_PAYMENT', null, 'notFound'],
    ['PUBLISHED', FUTURE, 'notFound'],
  ])('%s with expiresAt %s → %s', (status, expiresAt, expected) => {
    expect(classifyUnavailableJob(tombstone({ status, expiresAt }), NOW)).toBe(expected);
  });

  it('treats a missing posting as notFound', () => {
    expect(classifyUnavailableJob(null, NOW)).toBe('notFound');
  });

  it('never reveals postings restricted to an organization', () => {
    expect(classifyUnavailableJob(tombstone({ restrictedToOrganizationId: 7 }), NOW)).toBe(
      'notFound'
    );
  });
});

describe('fetchUnavailableJob', () => {
  const respond = (posting: JobTombstone | null) =>
    jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { JobPosting_by_pk: posting } }),
    });

  afterEach(() => {
    delete process.env.HASURA_ADMIN_SECRET;
  });

  it('returns the posting and prefers the custom company name', async () => {
    process.env.HASURA_ADMIN_SECRET = 'secret';
    global.fetch = respond(tombstone({ customCompany: 'Beispiel Kiel' }));
    const { fetchUnavailableJob } = loadJobs();
    await expect(fetchUnavailableJob(1)).resolves.toEqual({
      reason: 'expired',
      job: {
        title: 'Werkstudent:in Marketing',
        company: 'Beispiel Kiel',
        type: 'WORKING_STUDENT',
        occupation: 'MARKETING_ADVERTISING',
      },
    });
  });

  it('withholds the details of a posting that was never public', async () => {
    process.env.HASURA_ADMIN_SECRET = 'secret';
    global.fetch = respond(tombstone({ status: 'DRAFT', expiresAt: null }));
    const { fetchUnavailableJob } = loadJobs();
    await expect(fetchUnavailableJob(1)).resolves.toEqual({ reason: 'notFound', job: null });
  });

  it('degrades to notFound without the admin secret', async () => {
    global.fetch = jest.fn();
    const { fetchUnavailableJob } = loadJobs();
    await expect(fetchUnavailableJob(1)).resolves.toEqual({ reason: 'notFound', job: null });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('degrades to notFound when Hasura fails', async () => {
    process.env.HASURA_ADMIN_SECRET = 'secret';
    global.fetch = jest.fn().mockRejectedValue(new Error('down'));
    const { fetchUnavailableJob } = loadJobs();
    await expect(fetchUnavailableJob(1)).resolves.toEqual({ reason: 'notFound', job: null });
  });
});

describe('normalizeRegionParam', () => {
  const { normalizeRegionParam } = loadJobs();

  it.each([
    ['-2', 'FLENSBURG'],
    ['0', 'KIEL'],
    ['4', 'ABROAD'],
    ['GERMANY', 'GERMANY'],
    ['-1', ''],
    ['kiel', ''],
    ['', ''],
  ])('maps %p to %p', (param, expected) => {
    expect(normalizeRegionParam(param)).toBe(expected);
  });
});
