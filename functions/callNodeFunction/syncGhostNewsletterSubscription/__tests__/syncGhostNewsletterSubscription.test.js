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

const { default: syncGhostNewsletterSubscription } = await import('../index.js');

const USER_ID = '11111111-1111-1111-1111-111111111111';
// The default platform organization has id 0.
const DEFAULT_ORGANIZATION_ID = 0;

const buildEvent = (newRow) => ({
  body: { event: { op: 'INSERT', data: { old: null, new: newRow } } },
});

describe('syncGhostNewsletterSubscription', () => {
  beforeEach(() => {
    mockGraphqlRequest.mockReset();
    process.env.HASURA_ENDPOINT = 'http://hasura.test/v1/graphql';
    process.env.HASURA_ADMIN_SECRET = 'test-secret';
  });

  it('syncs subscriptions of the default organization (id 0)', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({
      OrganizationNewsletterSubscription_by_pk: {
        userId: USER_ID,
        organizationId: DEFAULT_ORGANIZATION_ID,
        status: 'SUBSCRIBED',
        source: 'WEBHOOK',
      },
    });

    const result = await syncGhostNewsletterSubscription(
      buildEvent({ userId: USER_ID, organizationId: DEFAULT_ORGANIZATION_ID }),
      mockLogger
    );

    expect(result.messageKey).toBe('SOURCE_WEBHOOK_SKIPPED');
    expect(mockGraphqlRequest).toHaveBeenCalledWith(expect.anything(), {
      userId: USER_ID,
      organizationId: DEFAULT_ORGANIZATION_ID,
    });
  });

  it('rejects events without an organizationId', async () => {
    const result = await syncGhostNewsletterSubscription(buildEvent({ userId: USER_ID }), mockLogger);

    expect(result.messageKey).toBe('INVALID_EVENT_PAYLOAD');
    expect(mockGraphqlRequest).not.toHaveBeenCalled();
  });

  it('records a sync error for the default organization (id 0)', async () => {
    mockGraphqlRequest.mockRejectedValueOnce(new Error('Hasura unavailable')).mockResolvedValueOnce({});

    const result = await syncGhostNewsletterSubscription(
      buildEvent({ userId: USER_ID, organizationId: DEFAULT_ORGANIZATION_ID }),
      mockLogger
    );

    expect(result.messageKey).toBe('GHOST_SYNC_FAILED');
    expect(mockGraphqlRequest).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: USER_ID,
        organizationId: DEFAULT_ORGANIZATION_ID,
        status: 'ERROR',
      })
    );
  });
});
