import { jest } from '@jest/globals';

const mockGraphqlRequest = jest.fn();

const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.unstable_mockModule('graphql-request', () => {
  const actual = jest.requireActual('graphql-request');
  return {
    ...actual,
    GraphQLClient: jest.fn().mockImplementation(() => ({
      request: mockGraphqlRequest,
    })),
  };
});

const { default: setJobPostingActive } = await import('../index.js');

const EMPLOYER_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_ID = '22222222-2222-2222-2222-222222222222';

const DAY = 24 * 60 * 60 * 1000;
const future = () => new Date(Date.now() + 7 * DAY).toISOString();
const past = () => new Date(Date.now() - DAY).toISOString();

const buildRequest = ({ role = 'user', userId = EMPLOYER_ID, active, jobPostingId = 42 }) => ({
  body: {
    session_variables: {
      'x-hasura-role': role,
      ...(userId ? { 'x-hasura-user-id': userId } : {}),
    },
    input: { jobPostingId, active },
  },
});

const buildPosting = ({ status, expiresAt = future(), canManageJobs = true } = {}) => ({
  JobPosting_by_pk: {
    id: 42,
    status,
    expiresAt,
    Organization: {
      OrganizationAdmins: [{ userId: EMPLOYER_ID, canManageJobs }],
    },
  },
});

/** The handler reads the posting, then issues the conditional update. */
const queueResponses = (posting, affectedRows = 1) => {
  mockGraphqlRequest.mockResolvedValueOnce(posting);
  mockGraphqlRequest.mockResolvedValueOnce({ update_JobPosting: { affected_rows: affectedRows } });
};

describe('setJobPostingActive', () => {
  beforeEach(() => {
    mockGraphqlRequest.mockReset();
  });

  it('deactivates a published posting without touching its window', async () => {
    queueResponses(buildPosting({ status: 'PUBLISHED' }));

    const result = await setJobPostingActive(buildRequest({ active: false }), mockLogger);

    expect(result).toEqual({ success: true, status: 'DEACTIVATED' });
    const [, variables] = mockGraphqlRequest.mock.calls[1];
    expect(variables).toMatchObject({ id: 42, from: 'PUBLISHED', to: 'DEACTIVATED' });
    expect(variables).not.toHaveProperty('expiresAt');
  });

  it('reactivates a deactivated posting within its window', async () => {
    queueResponses(buildPosting({ status: 'DEACTIVATED' }));

    const result = await setJobPostingActive(buildRequest({ active: true }), mockLogger);

    expect(result).toEqual({ success: true, status: 'PUBLISHED' });
    const [, variables] = mockGraphqlRequest.mock.calls[1];
    expect(variables).toMatchObject({ from: 'DEACTIVATED', to: 'PUBLISHED' });
  });

  it('refuses to reactivate once the window has ended', async () => {
    mockGraphqlRequest.mockResolvedValueOnce(buildPosting({ status: 'DEACTIVATED', expiresAt: past() }));

    const result = await setJobPostingActive(buildRequest({ active: true }), mockLogger);

    expect(result).toMatchObject({ success: false, messageKey: 'WINDOW_EXPIRED' });
    expect(mockGraphqlRequest).toHaveBeenCalledTimes(1);
  });

  it('reports a concurrent change when the conditional update matches nothing', async () => {
    queueResponses(buildPosting({ status: 'DEACTIVATED' }), 0);

    const result = await setJobPostingActive(buildRequest({ active: true }), mockLogger);

    expect(result).toMatchObject({ success: false, messageKey: 'STATUS_CHANGED' });
  });

  it.each([
    ['deactivate', false, 'DRAFT'],
    ['deactivate', false, 'ARCHIVED'],
    ['reactivate', true, 'ARCHIVED'],
    ['reactivate', true, 'EXPIRED'],
    ['reactivate', true, 'PUBLISHED'],
  ])('refuses to %s a posting in status %s', async (_label, active, status) => {
    mockGraphqlRequest.mockResolvedValueOnce(buildPosting({ status }));

    const result = await setJobPostingActive(buildRequest({ active }), mockLogger);

    expect(result).toMatchObject({ success: false, messageKey: 'INVALID_STATUS' });
    expect(mockGraphqlRequest).toHaveBeenCalledTimes(1);
  });

  it('rejects users without a canManageJobs grant on the organization', async () => {
    mockGraphqlRequest.mockResolvedValueOnce(buildPosting({ status: 'PUBLISHED' }));

    const result = await setJobPostingActive(
      buildRequest({ userId: OTHER_ID, active: false }),
      mockLogger
    );

    expect(result).toMatchObject({ success: false, messageKey: 'UNAUTHORIZED' });
    expect(mockGraphqlRequest).toHaveBeenCalledTimes(1);
  });

  it('rejects org admins whose grant lacks canManageJobs', async () => {
    mockGraphqlRequest.mockResolvedValueOnce(
      buildPosting({ status: 'PUBLISHED', canManageJobs: false })
    );

    const result = await setJobPostingActive(buildRequest({ active: false }), mockLogger);

    expect(result).toMatchObject({ success: false, messageKey: 'UNAUTHORIZED' });
  });

  it('lets admins change any posting', async () => {
    queueResponses(buildPosting({ status: 'PUBLISHED', canManageJobs: false }));

    const result = await setJobPostingActive(
      buildRequest({ role: 'admin', userId: OTHER_ID, active: false }),
      mockLogger
    );

    expect(result).toEqual({ success: true, status: 'DEACTIVATED' });
  });

  it('requires a boolean active flag and a session user', async () => {
    expect(
      await setJobPostingActive(buildRequest({ active: 'yes' }), mockLogger)
    ).toMatchObject({ messageKey: 'INVALID_INPUT' });
    expect(
      await setJobPostingActive(buildRequest({ userId: null, active: true }), mockLogger)
    ).toMatchObject({ messageKey: 'UNAUTHORIZED' });
    expect(mockGraphqlRequest).not.toHaveBeenCalled();
  });
});
