import { GraphQLClient, gql } from 'graphql-request';

import { authorizeOrganizationAdminFieldChange } from '../lib/organizationAdminFieldAuthorization.js';

/**
 * Updates (or clears) an organization's public website link, for the people
 * entitled to change it.
 *
 * Same shape as save/removeOrganizationLogo and the same reason: the column
 * write happens here with an admin-secret client rather than via a follow-up
 * client mutation against Organization, since a StuJo request's session role
 * (`user`) has no Hasura update permission on Organization to fall back on,
 * and the plain column update permission requires canManageSettings
 * unconditionally — it cannot express the job-offer-only fallback. See
 * authorizeOrganizationAdminFieldChange for that rule.
 */

const HTTP_URL_PATTERN = /^https?:\/\//i;

const UPDATE_ORGANIZATION_WEBSITE = gql`
  mutation UpdateOrganizationWebsite($organizationId: Int!, $website: String) {
    update_Organization_by_pk(pk_columns: { id: $organizationId }, _set: { website: $website }) {
      id
      website
    }
  }
`;

export default async function updateOrganizationWebsite(req, logger) {
  logger.info('########## Update Organization Website ##########');

  try {
    const sessionUserId = req.body?.session_variables?.['x-hasura-user-id'];
    const sessionRole = req.body?.session_variables?.['x-hasura-role'];
    const organizationId = Number(req.body?.input?.organizationid);

    if (!Number.isInteger(organizationId) || organizationId <= 0) {
      return {
        success: false,
        messageKey: 'INVALID_INPUT',
        error: 'organizationid is required',
      };
    }

    const website = (req.body?.input?.website ?? '').trim();
    if (website && !HTTP_URL_PATTERN.test(website)) {
      return {
        success: false,
        messageKey: 'INVALID_INPUT',
        error: 'website must be an absolute http(s) URL',
      };
    }

    const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
      headers: { 'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET },
    });

    const authorization = await authorizeOrganizationAdminFieldChange(client, {
      sessionUserId,
      sessionRole,
      organizationId,
    });
    if (!authorization.authorized) {
      return { success: false, messageKey: 'UNAUTHORIZED', error: authorization.reason };
    }

    const persisted = await client.request(UPDATE_ORGANIZATION_WEBSITE, {
      organizationId,
      website: website || null,
    });

    if (!persisted?.update_Organization_by_pk) {
      logger.error('Organization not found when persisting website', { organizationId });
      return {
        success: false,
        messageKey: 'ORGANIZATION_NOT_FOUND',
        error: 'Organization not found',
      };
    }

    return { success: true, website: persisted.update_Organization_by_pk.website };
  } catch (error) {
    logger.error('Error in updateOrganizationWebsite', { error: error.message, stack: error.stack });
    return {
      success: false,
      messageKey: 'WEBSITE_SAVE_ERROR',
      error: 'An error occurred while saving the website',
    };
  }
}
