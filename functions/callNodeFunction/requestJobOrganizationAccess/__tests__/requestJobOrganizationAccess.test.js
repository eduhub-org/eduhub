import { jest } from '@jest/globals';

const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

const REQUESTER = {
  id: 'user-1',
  firstName: 'Alex',
  lastName: 'Beispiel',
  email: 'alex@beispiel.de',
};

const ADMINS = [
  { id: 3, userId: 'user-2', User: { firstName: 'Kim', lastName: 'Koch', email: 'kim@beispiel.de' } },
  { id: 4, userId: 'user-3', User: { firstName: 'Lea', lastName: 'Lang', email: 'lea@beispiel.de' } },
];

const buildRequestMock = ({ admins = ADMINS, recent = [], organization = true }) =>
  jest.fn(async (document) => {
    const query = String(document);
    if (query.includes('GetRequesterForAccessRequest')) return { User_by_pk: REQUESTER };
    if (query.includes('GetOrganizationForAccessRequest')) {
      return {
        Organization_by_pk: organization
          ? { id: 7, name: 'Beispiel GmbH', OrganizationAdmins: admins }
          : null,
      };
    }
    if (query.includes('RecentJobOrganizationAccessRequests')) return { MailLog: recent };
    if (query.includes('GetJobPortalContactEmail')) {
      return { JobPortal: [{ contactEmail: 'stujo@opencampus.sh' }] };
    }
    throw new Error(`Unexpected query: ${query.slice(0, 80)}`);
  });

const accessInput = (input) => ({
  body: {
    session_variables: { 'x-hasura-user-id': REQUESTER.id, 'x-hasura-role': 'user' },
    input: { organizationId: 7, portalAppName: 'stujo', ...input },
  },
});

describe('requestJobOrganizationAccess', () => {
  let requestJobOrganizationAccess;
  let queueEmailMock;
  let requestMock;

  beforeAll(async () => {
    queueEmailMock = jest.fn(async () => ({ success: true, messageKey: 'EMAIL_QUEUED_SUCCESS' }));

    jest.unstable_mockModule('../../lib/queueEmail.js', () => ({ queueEmail: queueEmailMock }));
    jest.unstable_mockModule('graphql-request', () => {
      const actual = jest.requireActual('graphql-request');
      return {
        ...actual,
        GraphQLClient: jest.fn().mockImplementation(() => ({
          request: (...args) => requestMock(...args),
        })),
      };
    });

    const module = await import('../index.js');
    requestJobOrganizationAccess = module.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    queueEmailMock.mockResolvedValue({ success: true, messageKey: 'EMAIL_QUEUED_SUCCESS' });
    process.env.HASURA_ENDPOINT = 'https://test.hasura.app/v1/graphql';
    process.env.HASURA_ADMIN_SECRET = 'test-secret';
    process.env.FRONTEND_URL = 'https://edu.opencampus.sh';
  });

  it('refuses a request without an authenticated session user', async () => {
    requestMock = buildRequestMock({});
    const result = await requestJobOrganizationAccess(
      { body: { session_variables: {}, input: { organizationId: 7 } } },
      mockLogger
    );

    expect(result).toMatchObject({ success: false, messageKey: 'UNAUTHORIZED' });
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('mails every existing job admin, blind-copying the StuJo contact address', async () => {
    requestMock = buildRequestMock({});

    const result = await requestJobOrganizationAccess(accessInput({}), mockLogger);

    expect(result).toMatchObject({ success: true, messageKey: 'REQUEST_SENT' });
    expect(queueEmailMock).toHaveBeenCalledTimes(2);
    expect(queueEmailMock.mock.calls.map(([args]) => args.recipientEmail)).toEqual([
      'kim@beispiel.de',
      'lea@beispiel.de',
    ]);
    for (const [args] of queueEmailMock.mock.calls) {
      expect(args).toMatchObject({
        templateType: 'JOB_ORGANIZATION_ACCESS_REQUEST',
        extraBcc: 'stujo@opencampus.sh',
      });
      // The dedup key must not carry a jobPostingId: MailLog_job_posting_mail_unique
      // constrains every row that does, and two requests would collide on it.
      expect(args.metadata).not.toHaveProperty('jobPostingId');
    }

    // Each row is keyed by its recipient as well, so
    // MailLog_job_organization_access_request_unique still permits one mail per administrator
    // while rejecting a genuine duplicate — and a delivery that failed for one administrator does
    // not block a retry for the others.
    expect(queueEmailMock.mock.calls.map(([args]) => args.metadata)).toEqual([
      {
        type: 'JOB_ORGANIZATION_ACCESS_REQUEST',
        organizationId: 7,
        requesterUserId: REQUESTER.id,
        adminUserId: 'user-2',
      },
      {
        type: 'JOB_ORGANIZATION_ACCESS_REQUEST',
        organizationId: 7,
        requesterUserId: REQUESTER.id,
        adminUserId: 'user-3',
      },
    ]);
  });

  it('refuses a second request for the same organization within the rate-limit window', async () => {
    requestMock = buildRequestMock({ recent: [{ id: 500 }] });

    const result = await requestJobOrganizationAccess(accessInput({}), mockLogger);

    expect(result).toMatchObject({ success: false, messageKey: 'REQUEST_ALREADY_SENT' });
    expect(queueEmailMock).not.toHaveBeenCalled();
  });

  it('sends nobody anything when the organization has no job admin to ask', async () => {
    requestMock = buildRequestMock({ admins: [] });

    const result = await requestJobOrganizationAccess(accessInput({}), mockLogger);

    expect(result).toMatchObject({ success: false, messageKey: 'NO_JOB_ADMIN' });
    expect(queueEmailMock).not.toHaveBeenCalled();
  });

  it('tells a caller who already manages the job offers that there is nothing to ask for', async () => {
    requestMock = buildRequestMock({
      admins: [{ id: 3, userId: REQUESTER.id, User: { firstName: 'Alex', lastName: 'B', email: 'a@b.de' } }],
    });

    const result = await requestJobOrganizationAccess(accessInput({}), mockLogger);

    expect(result).toMatchObject({ success: false, messageKey: 'ALREADY_GRANTED' });
    expect(queueEmailMock).not.toHaveBeenCalled();
  });

  it('reports failure when not a single mail could be queued', async () => {
    queueEmailMock.mockResolvedValue({ success: false, messageKey: 'TEMPLATE_NOT_FOUND' });
    requestMock = buildRequestMock({});

    const result = await requestJobOrganizationAccess(accessInput({}), mockLogger);

    expect(result).toMatchObject({ success: false, messageKey: 'REQUEST_NOT_SENT' });
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('reports a missing organization', async () => {
    requestMock = buildRequestMock({ organization: false });

    const result = await requestJobOrganizationAccess(accessInput({}), mockLogger);

    expect(result).toMatchObject({ success: false, messageKey: 'ORGANIZATION_NOT_FOUND' });
  });
});
