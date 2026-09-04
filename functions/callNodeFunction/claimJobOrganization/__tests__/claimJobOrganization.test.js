import { jest } from '@jest/globals';

const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

const CLAIMER = {
  id: 'user-1',
  firstName: 'Alex',
  lastName: 'Beispiel',
  email: 'alex@beispiel.de',
};

/**
 * The handler issues its queries in a fixed order, so the tests describe the
 * database by intent (which query, what it returns) rather than by call index.
 * A response map keeps each test readable and lets it assert on the mutations
 * that were NOT sent, which is where the interesting guarantees live.
 */
const buildRequestMock = ({ organization = null, candidates = [], created = null }) =>
  jest.fn(async (document) => {
    const query = String(document);
    if (query.includes('GetClaimerForOrganizationClaim')) return { User_by_pk: CLAIMER };
    if (query.includes('FindOrganizationCandidatesForClaim')) return { Organization: candidates };
    if (query.includes('GetOrganizationForClaim')) return { Organization_by_pk: organization };
    if (query.includes('CreateOrganizationForClaim')) return { insert_Organization_one: created };
    if (query.includes('GetJobPortalContactEmail')) return { JobPortal: [{ contactEmail: null }] };
    if (query.includes('InsertJobOrganizationGrant')) {
      return { insert_OrganizationAdmin_one: { id: 99 } };
    }
    throw new Error(`Unexpected query: ${query.slice(0, 80)}`);
  });

const claimInput = (input) => ({
  body: {
    session_variables: { 'x-hasura-user-id': CLAIMER.id, 'x-hasura-role': 'user' },
    input: { declareAuthorization: true, portalAppName: 'stujo', ...input },
  },
});

const grantMutations = (requestMock) =>
  requestMock.mock.calls.filter(([document]) =>
    String(document).includes('InsertJobOrganizationGrant')
  );

describe('claimJobOrganization', () => {
  let claimJobOrganization;
  let queueEmailMock;
  let requestMock;
  let fetchMock;

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
    claimJobOrganization = module.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    queueEmailMock.mockResolvedValue({ success: true, messageKey: 'EMAIL_QUEUED_SUCCESS' });
    process.env.HASURA_ENDPOINT = 'https://test.hasura.app/v1/graphql';
    process.env.HASURA_ADMIN_SECRET = 'test-secret';
    process.env.FRONTEND_URL = 'https://edu.opencampus.sh';
    process.env.STUJO_ADMIN_EMAIL = 'stujo@opencampus.sh';
    delete process.env.CLOUD_FUNCTION_LINK_ADD_KEYCLOAK_ROLE;
    fetchMock = jest.fn(async () => ({ ok: true }));
    global.fetch = fetchMock;
  });

  it('refuses a request without an authenticated session user', async () => {
    requestMock = buildRequestMock({});
    const result = await claimJobOrganization(
      { body: { session_variables: {}, input: { organizationId: 1, declareAuthorization: true } } },
      mockLogger
    );

    expect(result).toMatchObject({ success: false, messageKey: 'UNAUTHORIZED' });
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('refuses a claim that does not declare authorization', async () => {
    requestMock = buildRequestMock({});
    const result = await claimJobOrganization(
      claimInput({ organizationId: 1, declareAuthorization: false }),
      mockLogger
    );

    expect(result).toMatchObject({ success: false, messageKey: 'AUTHORIZATION_NOT_DECLARED' });
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('refuses both an id and a new name, and neither', async () => {
    requestMock = buildRequestMock({});

    const both = await claimJobOrganization(
      claimInput({ organizationId: 1, newOrganizationName: 'Beispiel GmbH' }),
      mockLogger
    );
    const neither = await claimJobOrganization(claimInput({}), mockLogger);

    expect(both).toMatchObject({ success: false, messageKey: 'INVALID_ORGANIZATION_INPUT' });
    expect(neither).toMatchObject({ success: false, messageKey: 'INVALID_ORGANIZATION_INPUT' });
  });

  it('grants an unclaimed organization and records it as unverified when the domain does not match', async () => {
    requestMock = buildRequestMock({
      organization: {
        id: 7,
        name: 'Andere GmbH',
        email: 'info@andere.de',
        website: 'https://www.andere.de',
        OrganizationAdmins: [],
      },
    });

    const result = await claimJobOrganization(claimInput({ organizationId: 7 }), mockLogger);

    expect(result).toMatchObject({ success: true, status: 'GRANTED', organizationId: 7 });
    const [[, variables]] = grantMutations(requestMock);
    expect(variables).toMatchObject({
      userId: CLAIMER.id,
      organizationId: 7,
      claimVerification: 'SELF_SERVICE_UNVERIFIED',
    });
    expect(variables.authorizationDeclaredAt).toBeTruthy();
    expect(queueEmailMock).toHaveBeenCalledTimes(1);
    expect(queueEmailMock.mock.calls[0][0]).toMatchObject({
      templateType: 'JOB_ORGANIZATION_CLAIMED',
      recipientEmail: 'stujo@opencampus.sh',
    });
  });

  it('records a domain-verified claim when the email domain matches the website', async () => {
    requestMock = buildRequestMock({
      organization: {
        id: 7,
        name: 'Beispiel GmbH',
        email: null,
        website: 'https://www.beispiel.de/karriere',
        OrganizationAdmins: [],
      },
    });

    await claimJobOrganization(claimInput({ organizationId: 7 }), mockLogger);

    const [[, variables]] = grantMutations(requestMock);
    expect(variables.claimVerification).toBe('SELF_SERVICE_DOMAIN_VERIFIED');
  });

  it('never verifies a free-mail address, even against a matching domain', async () => {
    requestMock = buildRequestMock({
      organization: {
        id: 7,
        name: 'GMX',
        email: 'kontakt@gmx.de',
        website: 'https://gmx.de',
        OrganizationAdmins: [],
      },
    });
    const freeMailClaimer = { ...CLAIMER, email: 'alex@gmx.de' };
    requestMock = jest.fn(async (document) => {
      const query = String(document);
      if (query.includes('GetClaimerForOrganizationClaim')) return { User_by_pk: freeMailClaimer };
      if (query.includes('GetOrganizationForClaim')) {
        return {
          Organization_by_pk: {
            id: 7,
            name: 'GMX',
            email: 'kontakt@gmx.de',
            website: 'https://gmx.de',
            OrganizationAdmins: [],
          },
        };
      }
      if (query.includes('InsertJobOrganizationGrant')) {
        return { insert_OrganizationAdmin_one: { id: 99 } };
      }
      throw new Error(`Unexpected query: ${query.slice(0, 80)}`);
    });

    await claimJobOrganization(claimInput({ organizationId: 7 }), mockLogger);

    const [[, variables]] = grantMutations(requestMock);
    expect(variables.claimVerification).toBe('SELF_SERVICE_UNVERIFIED');
  });

  it('reports an organization that someone else already manages, without granting or mailing', async () => {
    requestMock = buildRequestMock({
      organization: {
        id: 7,
        name: 'Beispiel GmbH',
        email: null,
        website: null,
        OrganizationAdmins: [
          { id: 3, userId: 'user-2', canManageJobs: true, User: { firstName: 'Kim', lastName: 'Koch' } },
        ],
      },
    });

    const result = await claimJobOrganization(claimInput({ organizationId: 7 }), mockLogger);

    expect(result).toMatchObject({
      success: true,
      status: 'ALREADY_CLAIMED',
      existingAdminName: 'Kim Koch',
    });
    expect(result.existingAdminName).not.toContain('@');
    expect(grantMutations(requestMock)).toHaveLength(0);
    expect(queueEmailMock).not.toHaveBeenCalled();
  });

  it('is idempotent when the caller already manages the job offers', async () => {
    requestMock = buildRequestMock({
      organization: {
        id: 7,
        name: 'Beispiel GmbH',
        email: null,
        website: null,
        OrganizationAdmins: [
          { id: 3, userId: CLAIMER.id, canManageJobs: true, User: { firstName: 'Alex', lastName: 'Beispiel' } },
        ],
      },
    });

    const result = await claimJobOrganization(claimInput({ organizationId: 7 }), mockLogger);

    expect(result).toMatchObject({ success: true, status: 'ALREADY_GRANTED' });
    expect(grantMutations(requestMock)).toHaveLength(0);
  });

  it('reuses an existing organization whose name differs only in case and punctuation', async () => {
    requestMock = jest.fn(async (document) => {
      const query = String(document);
      if (query.includes('GetClaimerForOrganizationClaim')) return { User_by_pk: CLAIMER };
      if (query.includes('FindOrganizationCandidatesForClaim')) {
        return { Organization: [{ id: 12, name: 'Beispiel  GmbH.', aliases: null }] };
      }
      if (query.includes('GetOrganizationForClaim')) {
        return {
          Organization_by_pk: {
            id: 12,
            name: 'Beispiel  GmbH.',
            email: null,
            website: 'https://beispiel.de',
            OrganizationAdmins: [],
          },
        };
      }
      if (query.includes('InsertJobOrganizationGrant')) {
        return { insert_OrganizationAdmin_one: { id: 99 } };
      }
      throw new Error(`Unexpected query: ${query.slice(0, 80)}`);
    });

    const result = await claimJobOrganization(
      claimInput({ newOrganizationName: 'beispiel gmbh' }),
      mockLogger
    );

    expect(result).toMatchObject({ success: true, status: 'GRANTED', organizationId: 12 });
    const created = requestMock.mock.calls.filter(([document]) =>
      String(document).includes('CreateOrganizationForClaim')
    );
    expect(created).toHaveLength(0);
  });

  it('creates a genuinely new organization with its grant in one mutation', async () => {
    requestMock = buildRequestMock({
      candidates: [],
      created: { id: 21, name: 'Ganz Neu GmbH' },
    });

    const result = await claimJobOrganization(
      claimInput({ newOrganizationName: 'Ganz Neu GmbH' }),
      mockLogger
    );

    expect(result).toMatchObject({ success: true, status: 'GRANTED', organizationId: 21 });

    // The grant is nested in the organization insert, so there is no second write that could
    // fail and leave an organization nobody administers.
    const [[, variables]] = requestMock.mock.calls.filter(([document]) =>
      String(document).includes('CreateOrganizationForClaim')
    );
    expect(variables).toMatchObject({
      name: 'Ganz Neu GmbH',
      userId: CLAIMER.id,
      claimVerification: 'NEW_ORGANIZATION',
    });
    expect(variables.authorizationDeclaredAt).toBeTruthy();
    expect(grantMutations(requestMock)).toHaveLength(0);
  });

  it('reports ALREADY_CLAIMED when the database rejects a concurrent claim', async () => {
    // organization_admin_single_job_claim raises this when another claim won the race between the
    // handler's check and its insert.
    requestMock = jest.fn(async (document) => {
      const query = String(document);
      if (query.includes('GetClaimerForOrganizationClaim')) return { User_by_pk: CLAIMER };
      if (query.includes('GetOrganizationForClaim')) {
        return {
          Organization_by_pk: {
            id: 7,
            name: 'Beispiel GmbH',
            email: null,
            website: null,
            OrganizationAdmins: [],
          },
        };
      }
      if (query.includes('InsertJobOrganizationGrant')) {
        throw new Error(
          'Uniqueness violation. check constraint ... HINT: job_claim_already_taken'
        );
      }
      throw new Error(`Unexpected query: ${query.slice(0, 80)}`);
    });

    const result = await claimJobOrganization(claimInput({ organizationId: 7 }), mockLogger);

    expect(result).toMatchObject({ success: true, status: 'ALREADY_CLAIMED', organizationId: 7 });
    expect(queueEmailMock).not.toHaveBeenCalled();
  });

  it('surfaces an unexpected insert failure instead of calling it ALREADY_CLAIMED', async () => {
    requestMock = jest.fn(async (document) => {
      const query = String(document);
      if (query.includes('GetClaimerForOrganizationClaim')) return { User_by_pk: CLAIMER };
      if (query.includes('GetOrganizationForClaim')) {
        return {
          Organization_by_pk: { id: 7, name: 'Beispiel GmbH', email: null, website: null, OrganizationAdmins: [] },
        };
      }
      if (query.includes('InsertJobOrganizationGrant')) throw new Error('connection reset');
      throw new Error(`Unexpected query: ${query.slice(0, 80)}`);
    });

    const result = await claimJobOrganization(claimInput({ organizationId: 7 }), mockLogger);

    expect(result).toMatchObject({ success: false, messageKey: 'CLAIM_JOB_ORGANIZATION_ERROR' });
  });

  it('still grants when the notification mail cannot be queued', async () => {
    queueEmailMock.mockResolvedValue({ success: false, messageKey: 'TEMPLATE_NOT_FOUND' });
    requestMock = buildRequestMock({
      organization: { id: 7, name: 'Beispiel GmbH', email: null, website: null, OrganizationAdmins: [] },
    });

    const result = await claimJobOrganization(claimInput({ organizationId: 7 }), mockLogger);

    expect(result).toMatchObject({ success: true, status: 'GRANTED' });
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('skips the mail rather than failing when no contact address is configured', async () => {
    delete process.env.STUJO_ADMIN_EMAIL;
    requestMock = jest.fn(async (document) => {
      const query = String(document);
      if (query.includes('GetClaimerForOrganizationClaim')) return { User_by_pk: CLAIMER };
      if (query.includes('GetJobPortalContactEmail')) return { JobPortal: [{ contactEmail: null }] };
      if (query.includes('GetOrganizationForClaim')) {
        return {
          Organization_by_pk: { id: 7, name: 'Beispiel GmbH', email: null, website: null, OrganizationAdmins: [] },
        };
      }
      if (query.includes('InsertJobOrganizationGrant')) {
        return { insert_OrganizationAdmin_one: { id: 99 } };
      }
      throw new Error(`Unexpected query: ${query.slice(0, 80)}`);
    });

    const result = await claimJobOrganization(claimInput({ organizationId: 7 }), mockLogger);

    expect(result).toMatchObject({ success: true, status: 'GRANTED' });
    expect(queueEmailMock).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalled();
  });
});
