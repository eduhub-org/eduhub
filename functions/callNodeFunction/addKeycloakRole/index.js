import { addKeycloakClientRole } from '../lib/keycloakClientRole.js';

// Grants the Keycloak `hasura` client role named in the `role` header
// (instructor, org_admin, ...) to the user of an inserted row. Called by
// event triggers on CourseInstructor and OrganizationAdmin. Formerly its own
// unit (functions/addKeycloakRole).
//
// A role the user already holds is a no-op. A role that is not defined on the
// client is a configuration error: it answers 500, as the old unit did, so
// the trigger retries and the failure shows in the event log instead of
// passing as a grant (org_admin was once missing in production and every
// OrganizationAdmin insert reported success while granting nothing).

/** @type {import('../lib/types.js').Handler} */
const addKeycloakRole = async (req, logger) => {
  const userId = req.body?.event?.data?.new?.userId;
  const role = req.headers.role;

  if (!userId || typeof role !== 'string' || role === '') {
    return {
      httpStatus: 400,
      success: false,
      error: 'No userId in the event or no role header',
      messageKey: 'MISSING_ARGUMENTS',
    };
  }

  let outcome;
  try {
    outcome = await addKeycloakClientRole(userId, role, logger);
  } catch (error) {
    logger.error(`Could not grant Keycloak role '${role}'`, { userId, error: error.message });
    return { httpStatus: 500, success: false, error: error.message, messageKey: 'KEYCLOAK_ROLE_GRANT_FAILED' };
  }

  if (outcome.granted) {
    return {
      success: true,
      messageKey: outcome.reason === 'ADDED' ? 'KEYCLOAK_ROLE_ADDED' : 'KEYCLOAK_ROLE_ALREADY_ASSIGNED',
    };
  }

  logger.error(`Keycloak role '${role}' not granted: ${outcome.reason}`, { userId });
  return {
    httpStatus: 500,
    success: false,
    error: outcome.reason === 'ROLE_UNKNOWN'
      ? `Role '${role}' is not defined on the hasura client`
      : `Role '${role}' could not be granted (${outcome.reason})`,
    messageKey: outcome.reason === 'ROLE_UNKNOWN' ? 'KEYCLOAK_ROLE_UNKNOWN' : 'KEYCLOAK_ROLE_GRANT_FAILED',
  };
};

export default addKeycloakRole;
