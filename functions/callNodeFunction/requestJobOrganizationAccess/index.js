import { GraphQLClient, gql } from 'graphql-request';

import { queueEmail } from '../lib/queueEmail.js';
import { createOrganizationClaimVariableReplacer } from '../emailTemplateVariables.js';
import { adminAccessUrl, displayName, resolveContactEmail } from '../lib/jobOrganizationClaim.js';

/**
 * Asks the people who already manage an organization's job offers to let a
 * colleague in.
 *
 * The claim flow stops at "someone already manages these" and shows only that
 * person's display name, never their address — so this action is how the two
 * are put in touch, and it travels one way: the mail goes TO the existing
 * admins, with the StuJo contact address blind-copied so opencampus can help if
 * the requester does not know who to ask. Nothing is granted here.
 */

const RATE_LIMIT_HOURS = 24;

const GET_REQUESTER = gql`
  query GetRequesterForAccessRequest($userId: uuid!) {
    User_by_pk(id: $userId) {
      id
      firstName
      lastName
      email
    }
  }
`;

const GET_ORGANIZATION = gql`
  query GetOrganizationForAccessRequest($id: Int!) {
    Organization_by_pk(id: $id) {
      id
      name
      OrganizationAdmins(where: { canManageJobs: { _eq: true } }) {
        id
        userId
        User {
          firstName
          lastName
          email
        }
      }
    }
  }
`;

// The rate limit reads back this action's own mails. `metadata` is the same
// mechanism the job posting mails use for deduplication, but deliberately
// WITHOUT a `jobPostingId` key: the partial unique index
// MailLog_job_posting_mail_unique constrains every row that carries one, and two
// access requests for different organizations would collide on it.
const RECENT_REQUESTS = gql`
  query RecentJobOrganizationAccessRequests($metadata: jsonb!, $since: timestamptz!) {
    MailLog(where: { metadata: { _contains: $metadata }, created_at: { _gte: $since } }, limit: 1) {
      id
    }
  }
`;

export default async function requestJobOrganizationAccess(req, logger) {
  logger.info('########## Request Job Organization Access ##########');

  try {
    const sessionUserId = req.body?.session_variables?.['x-hasura-user-id'];
    const { organizationId, portalAppName } = req.body.input || req.body;

    if (!sessionUserId) {
      return { success: false, error: 'Missing authenticated session user', messageKey: 'UNAUTHORIZED' };
    }
    if (!Number.isInteger(organizationId) || organizationId <= 0) {
      return { success: false, error: 'organizationId is required', messageKey: 'MISSING_ORGANIZATION_ID' };
    }

    const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
      headers: { 'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET },
    });

    const requester = (await client.request(GET_REQUESTER, { userId: sessionUserId }))?.User_by_pk;
    if (!requester) {
      return { success: false, error: 'Requesting user not found', messageKey: 'USER_NOT_FOUND' };
    }

    const organization = (await client.request(GET_ORGANIZATION, { id: organizationId }))
      ?.Organization_by_pk;
    if (!organization) {
      return { success: false, error: 'Organization not found', messageKey: 'ORGANIZATION_NOT_FOUND' };
    }

    const admins = (organization.OrganizationAdmins ?? []).filter((grant) => grant.User?.email);
    if (admins.length === 0) {
      // Nobody to ask: the organization is claimable, so send them back to do that.
      return {
        success: false,
        error: 'This organization has no job admin to ask',
        messageKey: 'NO_JOB_ADMIN',
      };
    }
    if (admins.some((grant) => String(grant.userId) === String(sessionUserId))) {
      return { success: false, error: 'You already manage these job offers', messageKey: 'ALREADY_GRANTED' };
    }

    const dedupKey = {
      type: 'JOB_ORGANIZATION_ACCESS_REQUEST',
      organizationId,
      requesterUserId: sessionUserId,
    };
    const since = new Date(Date.now() - RATE_LIMIT_HOURS * 60 * 60 * 1000).toISOString();
    const recent = await client.request(RECENT_REQUESTS, { metadata: dedupKey, since });
    if (recent?.MailLog?.length > 0) {
      return {
        success: false,
        error: 'An access request for this organization was already sent recently',
        messageKey: 'REQUEST_ALREADY_SENT',
      };
    }

    const contactEmail = await resolveContactEmail(client, portalAppName, logger);
    const variableReplacer = createOrganizationClaimVariableReplacer(
      { name: organization.name },
      {
        userName: displayName(requester),
        userEmail: requester.email,
        adminUrl: adminAccessUrl(),
        contactEmail: contactEmail || '',
      }
    );

    let queued = 0;
    for (const grant of admins) {
      const result = await queueEmail({
        templateType: 'JOB_ORGANIZATION_ACCESS_REQUEST',
        variableReplacer,
        recipientEmail: grant.User.email,
        extraBcc: contactEmail,
        metadata: dedupKey,
        client,
        logger,
      });
      if (result.success) {
        queued += 1;
      } else {
        logger.error('Could not queue an access request mail', { messageKey: result.messageKey });
      }
    }

    if (queued === 0) {
      return {
        success: false,
        error: 'Could not send the access request',
        messageKey: 'REQUEST_NOT_SENT',
      };
    }

    return { success: true, messageKey: 'REQUEST_SENT' };
  } catch (error) {
    logger.error('Error in requestJobOrganizationAccess', { error: error.message, stack: error.stack });
    return {
      success: false,
      error: error.message || 'Internal server error',
      messageKey: 'REQUEST_JOB_ORGANIZATION_ACCESS_ERROR',
    };
  }
}
