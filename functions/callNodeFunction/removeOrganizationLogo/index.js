import { GraphQLClient, gql } from 'graphql-request';

import { authorizeOrganizationAdminFieldChange } from '../lib/organizationAdminFieldAuthorization.js';

/**
 * Clears an organization's logo, for the people entitled to change it.
 *
 * Counterpart to saveOrganizationLogo: there is no file to remove from the
 * caller's side (the storage object is simply orphaned, same as any other
 * replaced upload), only the Organization.logo column to null out. That write
 * has to happen here rather than via a client mutation against Organization
 * for the same reason saveOrganizationLogo persists the column itself — see
 * its comment and authorizeOrganizationAdminFieldChange for the authorization rule.
 */

const CLEAR_ORGANIZATION_LOGO = gql`
  mutation ClearOrganizationLogo($organizationId: Int!) {
    update_Organization_by_pk(pk_columns: { id: $organizationId }, _set: { logo: null }) {
      id
      logo
    }
  }
`;

export default async function removeOrganizationLogo(req, logger) {
  logger.info('########## Remove Organization Logo ##########');

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

    await client.request(CLEAR_ORGANIZATION_LOGO, { organizationId });

    return { success: true };
  } catch (error) {
    logger.error('Error in removeOrganizationLogo', { error: error.message, stack: error.stack });
    return {
      success: false,
      messageKey: 'IMAGE_REMOVE_ERROR',
      error: 'An error occurred while removing the image',
    };
  }
}
