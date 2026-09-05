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
const buildRequestMock = ({
  organization = null,
  candidates = [],
  created = null,
  portalContactEmail = null,
  expectedPortalAppName = 'stujo',
}) =>
  jest.fn(async (document, variables) => {
    const query = String(document);
    if (query.includes('GetClaimerForOrganizationClaim')) return { User_by_pk: CLAIMER };
    if (query.includes('FindOrganizationCandidatesForClaim')) return { Organization: candidates };
    if (query.includes('GetOrganizationForClaim')) return { Organization_by_pk: organization };
    if (query.includes('CreateOrganizationForClaim')) return { insert_Organization_one: created };
    if (query.includes('GetJobPortalContactEmail')) {
      // Asserted, not ignored: the point of the routing tests is which portal is looked up, so a
      // handler that asked about a different appName must fail them rather than get this answer.
      expect(variables).toMatchObject({ appName: expectedPortalAppName });
      return { JobPortal: [{ contactEmail: portalContactEmail }] };
    }
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
  let addRoleMock;

  beforeAll(async () => {
    queueEmailMock = jest.fn(async () => ({ success: true, messageKey: 'EMAIL_QUEUED_SUCCESS' }));
    addRoleMock = jest.fn(async () => ({ granted: true, reason: 'ADDED' }));

    jest.unstable_mockModule('../../lib/queueEmail.js', () => ({ queueEmail: queueEmailMock }));
    jest.unstable_mockModule('../../lib/keycloakClientRole.js', () => ({
      addKeycloakClientRole: addRoleMock,
    }));
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
    addRoleMock.mockResolvedValue({ granted: true, reason: 'ADDED' });
    process.env.HASURA_ENDPOINT = 'https://test.hasura.app/v1/graphql';
    process.env.HASURA_ADMIN_SECRET = 'test-secret';
    process.env.FRONTEND_URL = 'https://edu.opencampus.sh';
    process.env.STUJO_ADMIN_EMAIL = 'stujo@opencampus.sh';
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

  it('copies the platform address when the named portal has a contact of its own', async () => {
    // portalAppName is the caller's, so it must not be able to route the claim notification away
    // from whoever reviews these grants. Whatever portal is named, STUJO_ADMIN_EMAIL is copied in.
    requestMock = buildRequestMock({
      organization: { id: 7, name: 'Andere GmbH', email: null, website: null, OrganizationAdmins: [] },
      portalContactEmail: 'jobs@andere-hochschule.de',
      expectedPortalAppName: 'andere',
    });

    await claimJobOrganization(claimInput({ organizationId: 7, portalAppName: 'andere' }), mockLogger);

    expect(queueEmailMock).toHaveBeenCalledTimes(1);
    expect(queueEmailMock.mock.calls[0][0]).toMatchObject({
      recipientEmail: 'jobs@andere-hochschule.de',
      extraBcc: 'stujo@opencampus.sh',
    });
  });

  it('does not copy the platform address to itself when it is already the recipient', async () => {
    requestMock = buildRequestMock({
      organization: { id: 7, name: 'Andere GmbH', email: null, website: null, OrganizationAdmins: [] },
      portalContactEmail: 'stujo@opencampus.sh',
    });

    await claimJobOrganization(claimInput({ organizationId: 7 }), mockLogger);

    expect(queueEmailMock).toHaveBeenCalledTimes(1);
    expect(queueEmailMock.mock.calls[0][0]).toMatchObject({
      recipientEmail: 'stujo@opencampus.sh',
      extraBcc: null,
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
  // The bug this guards: the grant used to be handed to Keycloak only by the
  // add_keycloak_org_admin_role event trigger, asynchronously, while the
  // frontend re-authenticated the instant this action returned. The fresh token
  // then still lacked org_admin and the employer was told they had no company
  // until they signed out and back in.
  it('grants the Keycloak org_admin role before returning a claimed organization', async () => {
    requestMock = buildRequestMock({
      organization: { id: 7, name: 'Beispiel GmbH', email: null, website: null, OrganizationAdmins: [] },
    });

    const result = await claimJobOrganization(claimInput({ organizationId: 7 }), mockLogger);

    expect(result).toMatchObject({ success: true, status: 'GRANTED' });
    expect(addRoleMock).toHaveBeenCalledTimes(1);
    expect(addRoleMock.mock.calls[0].slice(0, 2)).toEqual([CLAIMER.id, 'org_admin']);
  });

  it('grants the Keycloak org_admin role for a newly created organization too', async () => {
    requestMock = buildRequestMock({ candidates: [], created: { id: 21, name: 'Ganz Neu GmbH' } });

    const result = await claimJobOrganization(
      claimInput({ newOrganizationName: 'Ganz Neu GmbH' }),
      mockLogger
    );

    expect(result).toMatchObject({ success: true, status: 'GRANTED', organizationId: 21 });
    expect(addRoleMock).toHaveBeenCalledTimes(1);
    expect(addRoleMock.mock.calls[0].slice(0, 2)).toEqual([CLAIMER.id, 'org_admin']);
  });

  it('does not touch Keycloak when no grant was made', async () => {
    requestMock = buildRequestMock({
      organization: {
        id: 7,
        name: 'Beispiel GmbH',
        email: null,
        website: null,
        OrganizationAdmins: [
          { id: 3, userId: 'someone-else', canManageJobs: true, User: { firstName: 'Bea', lastName: 'B' } },
        ],
      },
    });

    const result = await claimJobOrganization(claimInput({ organizationId: 7 }), mockLogger);

    expect(result).toMatchObject({ status: 'ALREADY_CLAIMED' });
    expect(addRoleMock).not.toHaveBeenCalled();
  });

  it('still reports the grant when Keycloak cannot be reached', async () => {
    // The database access is already committed, so a Keycloak hiccup must not be
    // reported as a failed claim — the event trigger retries the role.
    addRoleMock.mockRejectedValue(new Error('Keycloak role grant timed out after 8000ms'));
    requestMock = buildRequestMock({
      organization: { id: 7, name: 'Beispiel GmbH', email: null, website: null, OrganizationAdmins: [] },
    });

    const result = await claimJobOrganization(claimInput({ organizationId: 7 }), mockLogger);

    expect(result).toMatchObject({ success: true, status: 'GRANTED' });
    expect(mockLogger.warn).toHaveBeenCalled();
  });
});
