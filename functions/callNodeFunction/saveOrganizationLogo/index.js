import { GraphQLClient, gql } from 'graphql-request';

import saveImage from '../saveImage/index.js';

/**
 * Uploads an organization's logo, for the people entitled to change it.
 *
 * This action used to point straight at the generic saveImage handler, which
 * has no notion of who owns the target path: the only gate was the action
 * permission (instructor_access), so any instructor could overwrite any
 * organization's logo. Nothing exercised that — the single caller is the
 * super-admin organization screen — but self-service job-offer onboarding now
 * hands the org_admin role to members of the public, so "any org admin" is no
 * longer a safe audience for an unchecked write.
 *
 * The rule enforced here is the one that already governs the `logo` column on
 * Organization: canManageSettings for that organization. A job-only grant, the
 * kind a StuJo claim produces, does not qualify.
 *
 * Authorization has to live in the handler because Hasura action permissions
 * are role-level only and cannot express "this organization" — the same reason
 * publishJobPosting and archiveJobPosting check their grant themselves.
 */

const GET_SETTINGS_GRANT = gql`
  query GetOrganizationSettingsGrant($organizationId: Int!, $userId: uuid!) {
    OrganizationAdmin(
      where: {
        organizationId: { _eq: $organizationId }
        userId: { _eq: $userId }
        canManageSettings: { _eq: true }
      }
      limit: 1
    ) {
      id
    }
  }
`;

export default async function saveOrganizationLogo(req, logger) {
  logger.info('########## Save Organization Logo ##########');

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

    if (sessionRole !== 'admin') {
      if (!sessionUserId) {
        return {
          success: false,
          messageKey: 'UNAUTHORIZED',
          error: 'Missing authenticated session user',
        };
      }

      const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
        headers: { 'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET },
      });
      const data = await client.request(GET_SETTINGS_GRANT, {
        organizationId,
        userId: sessionUserId,
      });

      if (!data?.OrganizationAdmin?.length) {
        return {
          success: false,
          messageKey: 'UNAUTHORIZED',
          error: 'Not authorized to change this organization\'s logo',
        };
      }
    }

    // The path template, bucket and sizes still come from the action headers, so
    // the storage layout stays declared in the metadata next to the other uploads.
    return await saveImage(req);
  } catch (error) {
    logger.error('Error in saveOrganizationLogo', { error: error.message, stack: error.stack });
    return {
      success: false,
      messageKey: 'IMAGE_SAVE_ERROR',
      error: 'An error occurred while saving the image',
    };
  }
}
