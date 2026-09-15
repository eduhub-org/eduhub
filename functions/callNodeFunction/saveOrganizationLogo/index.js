import { GraphQLClient, gql } from 'graphql-request';

import saveImage from '../saveImage/index.js';
import { authorizeOrganizationLogoChange } from '../lib/organizationLogoAuthorization.js';

/**
 * Uploads an organization's logo, for the people entitled to change it, and
 * persists the resulting path onto Organization.logo itself.
 *
 * This action used to point straight at the generic saveImage handler, which
 * has no notion of who owns the target path: the only gate was the action
 * permission (instructor_access), so any instructor could overwrite any
 * organization's logo. Nothing exercised that — the single caller is the
 * super-admin organization screen — but self-service job-offer onboarding now
 * hands the org_admin role to members of the public, so "any org admin" is no
 * longer a safe audience for an unchecked write.
 *
 * The column write also happens here rather than in a follow-up client
 * mutation against Organization: a StuJo request's session role is `user`,
 * which carries no Hasura update permission on Organization at all, and even
 * under `org_admin` the column's update permission requires canManageSettings
 * unconditionally — it cannot express the job-offer-only fallback below. This
 * handler already holds an admin-secret client for the authorization check,
 * so it writes the column with the same client instead of asking the caller
 * to make a second request Hasura may or may not let through.
 *
 * See authorizeOrganizationLogoChange for the authorization rule itself.
 */

const SET_ORGANIZATION_LOGO = gql`
  mutation SetOrganizationLogo($organizationId: Int!, $logo: String) {
    update_Organization_by_pk(pk_columns: { id: $organizationId }, _set: { logo: $logo }) {
      id
      logo
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

    const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
      headers: { 'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET },
    });

    const authorization = await authorizeOrganizationLogoChange(client, {
      sessionUserId,
      sessionRole,
      organizationId,
    });
    if (!authorization.authorized) {
      return { success: false, messageKey: 'UNAUTHORIZED', error: authorization.reason };
    }

    // The path template, bucket and sizes still come from the action headers, so
    // the storage layout stays declared in the metadata next to the other uploads.
    const uploadResult = await saveImage(req);
    if (!uploadResult?.success) {
      return uploadResult;
    }

    await client.request(SET_ORGANIZATION_LOGO, { organizationId, logo: uploadResult.filePath });

    return uploadResult;
  } catch (error) {
    logger.error('Error in saveOrganizationLogo', { error: error.message, stack: error.stack });
    return {
      success: false,
      messageKey: 'IMAGE_SAVE_ERROR',
      error: 'An error occurred while saving the image',
    };
  }
}
