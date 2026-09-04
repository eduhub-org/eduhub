import { GraphQLClient, gql } from 'graphql-request';

import { queueEmail } from '../lib/queueEmail.js';
import { createOrganizationClaimVariableReplacer } from '../emailTemplateVariables.js';
import {
  CLAIM_NEW_ORGANIZATION,
  FIND_ORGANIZATION_CANDIDATES,
  adminAccessUrl,
  candidatePattern,
  classifyClaim,
  displayName,
  matchOrganizationByName,
  resolveContactEmail,
  verificationLabel,
} from '../lib/jobOrganizationClaim.js';

/**
 * Self-service claim of job-offer management for an organization.
 *
 * Why an action rather than a Hasura permission: OrganizationAdmin insert
 * requires the caller to already hold canManageSettings on the same
 * organization, so nobody can create an organization's FIRST grant. Opening
 * that up to `user_access` would let anyone grant themselves any capability
 * anywhere; the checks that make a claim acceptable — nobody else administers
 * these job offers yet, the claimer declared authority, the provenance is
 * recorded, opencampus is told — only hold if they run server-side.
 *
 * The claim is granted immediately, and deliberately: an employer who has to
 * wait for a human is an employer who does not post. What makes it operable is
 * the record it leaves (claimVerification, authorizationDeclaredAt) plus the
 * notification mail, and the fact that a job-only grant reads nothing sensitive
 * — the organization's banking, tax and register data live in the
 * OrganizationSettings view behind canManageSettings.
 */

const MAX_ORGANIZATION_NAME_LENGTH = 200;

/** How long to wait for the synchronous Keycloak role grant before leaving it to the retry path. */
const KEYCLOAK_ROLE_TIMEOUT_MS = 5000;

const GET_CLAIMER = gql`
  query GetClaimerForOrganizationClaim($userId: uuid!) {
    User_by_pk(id: $userId) {
      id
      firstName
      lastName
      email
    }
  }
`;

// The organization plus every admin of it. `email` and `website` are the only
// evidence available for domain verification; both are org-admin-only columns,
// which is fine here because this handler runs with the admin secret.
const GET_ORGANIZATION = gql`
  query GetOrganizationForClaim($id: Int!) {
    Organization_by_pk(id: $id) {
      id
      name
      email
      website
      OrganizationAdmins {
        id
        userId
        canManageJobs
        User {
          firstName
          lastName
        }
      }
    }
  }
`;

// Name and type only. `user_access` may insert 34 columns of this table,
// including banking and tax fields, but a claim has no business setting any of
// them: the employer fills their own profile in afterwards.
//
// The grant is nested rather than inserted afterwards so both writes share one transaction. Two
// statements would leave an organization with no admin whenever the second failed — and a retry
// would then match that orphan by name and claim it, which is exactly the state the name dedupe
// is supposed to prevent.
const CREATE_ORGANIZATION_WITH_GRANT = gql`
  mutation CreateOrganizationForClaim(
    $name: String!
    $userId: uuid!
    $claimVerification: String!
    $authorizationDeclaredAt: timestamptz!
  ) {
    insert_Organization_one(
      object: {
        name: $name
        type: CORPORATION
        OrganizationAdmins: {
          data: {
            userId: $userId
            canManageJobs: true
            claimVerification: $claimVerification
            authorizationDeclaredAt: $authorizationDeclaredAt
          }
        }
      }
    ) {
      id
      name
    }
  }
`;

const INSERT_GRANT = gql`
  mutation InsertJobOrganizationGrant(
    $userId: uuid!
    $organizationId: Int!
    $claimVerification: String!
    $authorizationDeclaredAt: timestamptz!
  ) {
    insert_OrganizationAdmin_one(
      object: {
        userId: $userId
        organizationId: $organizationId
        canManageJobs: true
        claimVerification: $claimVerification
        authorizationDeclaredAt: $authorizationDeclaredAt
      }
    ) {
      id
    }
  }
`;

/**
 * Hand the Keycloak `org_admin` role out synchronously.
 *
 * The add_keycloak_org_admin_role event trigger on OrganizationAdmin does this
 * too, but asynchronously, and the frontend re-authenticates the moment this
 * action returns to pick the role up. Losing that race means the fresh token
 * still lacks org_admin and the first JobPosting insert is rejected. The
 * function is idempotent (an already-assigned role is no longer "available" to
 * add), so doing both is safe. A failure here is logged, not fatal: the event
 * trigger retries.
 */
async function addKeycloakOrgAdminRole(userId, logger) {
  const url = process.env.CLOUD_FUNCTION_LINK_ADD_KEYCLOAK_ROLE;
  const secret = process.env.HASURA_CLOUD_FUNCTION_SECRET;
  if (!url || !secret) {
    logger.warn('Keycloak role webhook not configured, relying on the event trigger');
    return;
  }
  // Bounded, because by this point the grant is already committed: an endpoint that accepts the
  // connection and never answers would otherwise hold the action until the platform timeout and
  // report failure to somebody who does have access. The event trigger retries either way.
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), KEYCLOAK_ROLE_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', secret, role: 'org_admin' },
      body: JSON.stringify({ event: { data: { new: { userId } } } }),
      signal: controller.signal,
    });
    if (!response.ok) {
      logger.warn('Synchronous Keycloak role grant failed, relying on the event trigger', {
        status: response.status,
      });
    }
  } catch (error) {
    logger.warn('Synchronous Keycloak role grant failed, relying on the event trigger', {
      error: error.message,
    });
  } finally {
    clearTimeout(deadline);
  }
}

/**
 * Tell the address responsible for StuJo enquiries that a claim happened.
 *
 * The claim is already committed by the time this runs, so nothing in here may fail the request:
 * an unsent notification is a missing review signal, not a reason to deny somebody the access they
 * were just granted.
 */
async function notifyClaim(
  client,
  logger,
  { organizationName, organizationId, claimer, verification, portalAppName }
) {
  // portalAppName comes from the caller, and it selects which JobPortal.contactEmail is used. That
  // must not be a way to steer the notification away from whoever reviews these claims: the mail is
  // the review signal that makes an instant grant acceptable. So the platform address, which only
  // the deployment can set, is always copied in when it is configured and is not already the
  // recipient — whatever portal the caller names, the responsible mailbox learns of the claim.
  const platformEmail = process.env.STUJO_ADMIN_EMAIL || null;
  const contactEmail = await resolveContactEmail(client, portalAppName, logger);
  if (!contactEmail) {
    logger.warn('No StuJo contact address configured, claim notification skipped', {
      organizationId,
    });
    return;
  }
  const extraBcc = platformEmail && platformEmail !== contactEmail ? platformEmail : null;

  const mailResult = await queueEmail({
    templateType: 'JOB_ORGANIZATION_CLAIMED',
    variableReplacer: createOrganizationClaimVariableReplacer(
      { name: organizationName },
      {
        userName: displayName(claimer),
        userEmail: claimer.email,
        verification: verificationLabel(verification),
        adminUrl: adminAccessUrl(),
        contactEmail,
      }
    ),
    recipientEmail: contactEmail,
    extraBcc,
    metadata: { type: 'JOB_ORGANIZATION_CLAIMED', organizationId },
    client,
    logger,
  });
  if (!mailResult.success) {
    logger.error('Could not queue the claim notification', { messageKey: mailResult.messageKey });
  }
}

export default async function claimJobOrganization(req, logger) {
  logger.info('########## Claim Job Organization ##########');

  try {
    const sessionUserId = req.body?.session_variables?.['x-hasura-user-id'];
    const {
      organizationId,
      newOrganizationName,
      portalAppName,
      declareAuthorization,
    } = req.body.input || req.body;

    if (!sessionUserId) {
      return { success: false, error: 'Missing authenticated session user', messageKey: 'UNAUTHORIZED' };
    }
    if (declareAuthorization !== true) {
      return {
        success: false,
        error: 'The claimer must declare they are authorized to act for the organization',
        messageKey: 'AUTHORIZATION_NOT_DECLARED',
      };
    }

    const typedName = typeof newOrganizationName === 'string' ? newOrganizationName.trim() : '';
    const hasId = Number.isInteger(organizationId) && organizationId > 0;
    if (hasId === (typedName !== '')) {
      return {
        success: false,
        error: 'Provide exactly one of organizationId or newOrganizationName',
        messageKey: 'INVALID_ORGANIZATION_INPUT',
      };
    }
    if (!hasId && typedName.length > MAX_ORGANIZATION_NAME_LENGTH) {
      return {
        success: false,
        error: `Organization name must be at most ${MAX_ORGANIZATION_NAME_LENGTH} characters`,
        messageKey: 'ORGANIZATION_NAME_TOO_LONG',
      };
    }

    const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
      headers: { 'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET },
    });

    const claimer = (await client.request(GET_CLAIMER, { userId: sessionUserId }))?.User_by_pk;
    if (!claimer) {
      return { success: false, error: 'Claiming user not found', messageKey: 'USER_NOT_FOUND' };
    }

    let organization;
    let verification;

    if (hasId) {
      organization = (await client.request(GET_ORGANIZATION, { id: organizationId }))?.Organization_by_pk;
      if (!organization) {
        return { success: false, error: 'Organization not found', messageKey: 'ORGANIZATION_NOT_FOUND' };
      }
      verification = classifyClaim(claimer.email, organization);
    } else {
      // Dedupe before creating: the StuJo import left thousands of employer
      // records, many with near-duplicate names, so "create" usually means
      // "you meant this existing one".
      const pattern = candidatePattern(typedName);
      const candidates = pattern
        ? (await client.request(FIND_ORGANIZATION_CANDIDATES, { pattern }))?.Organization ?? []
        : [];
      const existing = matchOrganizationByName(typedName, candidates);

      if (existing) {
        organization = (await client.request(GET_ORGANIZATION, { id: existing.id }))?.Organization_by_pk;
        verification = classifyClaim(claimer.email, organization);
      } else {
        // A brand-new organization has no admins to check against, so the grant goes in with it,
        // in one transaction, and the flow is finished here.
        const created = (
          await client.request(CREATE_ORGANIZATION_WITH_GRANT, {
            name: typedName,
            userId: sessionUserId,
            claimVerification: CLAIM_NEW_ORGANIZATION,
            authorizationDeclaredAt: new Date().toISOString(),
          })
        )?.insert_Organization_one;

        await addKeycloakOrgAdminRole(sessionUserId, logger);
        await notifyClaim(client, logger, {
          organizationName: created.name,
          organizationId: created.id,
          claimer,
          verification: CLAIM_NEW_ORGANIZATION,
          portalAppName,
        });

        return {
          success: true,
          status: 'GRANTED',
          organizationId: created.id,
          organizationName: created.name,
        };
      }
    }

    const grants = organization.OrganizationAdmins ?? [];
    if (grants.some((grant) => String(grant.userId) === String(sessionUserId) && grant.canManageJobs)) {
      return {
        success: true,
        status: 'ALREADY_GRANTED',
        organizationId: organization.id,
        organizationName: organization.name,
      };
    }

    const otherJobAdmin = grants.find((grant) => grant.canManageJobs === true);
    if (otherJobAdmin) {
      // No grant, no mail: the requester decides whether to ask, in a second
      // step. Only the display name goes back — never the address.
      return {
        success: true,
        status: 'ALREADY_CLAIMED',
        organizationId: organization.id,
        organizationName: organization.name,
        existingAdminName: displayName(otherJobAdmin.User),
      };
    }

    // Everything above must hold BEFORE the insert: add_keycloak_org_admin_role
    // fires on it and hands out the Keycloak role.
    //
    // The database has the final say on "nobody else manages these job offers": the check above
    // reads a snapshot, so two people claiming the same unclaimed organization at the same moment
    // could both pass it. organization_admin_single_job_claim rejects the loser, and
    // ALREADY_CLAIMED is the honest answer for them.
    try {
      await client.request(INSERT_GRANT, {
        userId: sessionUserId,
        organizationId: organization.id,
        claimVerification: verification,
        authorizationDeclaredAt: new Date().toISOString(),
      });
    } catch (insertError) {
      if (String(insertError.message || '').includes('job_claim_already_taken')) {
        return {
          success: true,
          status: 'ALREADY_CLAIMED',
          organizationId: organization.id,
          organizationName: organization.name,
        };
      }
      throw insertError;
    }

    await addKeycloakOrgAdminRole(sessionUserId, logger);

    await notifyClaim(client, logger, {
      organizationName: organization.name,
      organizationId: organization.id,
      claimer,
      verification,
      portalAppName,
    });

    return {
      success: true,
      status: 'GRANTED',
      organizationId: organization.id,
      organizationName: organization.name,
    };
  } catch (error) {
    logger.error('Error in claimJobOrganization', { error: error.message, stack: error.stack });
    return {
      success: false,
      error: error.message || 'Internal server error',
      messageKey: 'CLAIM_JOB_ORGANIZATION_ERROR',
    };
  }
}
