import KcAdminClient from '@keycloak/keycloak-admin-client';
import { gql } from 'graphql-request';
import { mergeUserPutPayload } from '../shared/keycloakUserMerge.js';
import { computeMatrixHandle } from '../lib/matrixHandle.js';
import { createHasuraClient } from '../lib/hasura.js';
import { keycloakConfig } from '../lib/config.js';
import { authenticateKeycloakAdmin } from '../lib/keycloak.js';

// Login sync: creates or updates the User row from the person's Keycloak
// account. Called by the updateFromKeycloak action from NextAuth on every
// login. Formerly its own unit (functions/updateFromKeycloak).
//
// The action forwards client headers, so the identity dispatcher pins this
// handler to the action name (pinnedActions in index.js). Failures answer
// with a non-2xx `httpStatus`, as the old unit did, so Hasura turns them into
// a GraphQL error for the caller instead of a `result`.

const FIND_USER = gql`
  query ($id: uuid!) {
    User_by_pk(id: $id) {
      id
      firstName
      status
      matrixUserHandle
    }
  }
`;

const INSERT_USER = gql`
  mutation (
    $id: uuid!
    $firstname: String
    $lastname: String
    $email: String
    $matrixUserHandle: String
  ) {
    insert_User(
      objects: {
        id: $id
        firstName: $firstname
        lastName: $lastname
        email: $email
        matrixUserHandle: $matrixUserHandle
      }
    ) {
      returning {
        id
      }
    }
  }
`;

const UPDATE_USER = gql`
  mutation (
    $id: uuid!
    $firstname: String
    $lastname: String
    $email: String
    $matrixUserHandle: String
  ) {
    update_User(
      where: { id: { _eq: $id }, status: { _neq: DELETED } }
      _set: {
        firstName: $firstname
        lastName: $lastname
        email: $email
        matrixUserHandle: $matrixUserHandle
      }
    ) {
      affected_rows
    }
  }
`;

const FIND_EMAIL_HOLDERS = gql`
  query ($email: String!, $id: uuid!) {
    User(
      where: {
        email: { _eq: $email }
        status: { _neq: GUEST }
        id: { _neq: $id }
      }
    ) {
      id
    }
  }
`;

const SET_USER_EMAIL = gql`
  mutation ($id: uuid!, $email: String!) {
    update_User(
      where: { id: { _eq: $id }, status: { _neq: DELETED } }
      _set: { email: $email }
    ) {
      affected_rows
    }
  }
`;

/** A failure Hasura reports to the caller as a GraphQL error. */
const fail = (httpStatus, message, messageKey) => ({
  httpStatus,
  success: false,
  message,
  error: message,
  ...(messageKey && { messageKey }),
});

/**
 * Frees `email` for the account `userid` when another non-guest User row
 * still holds it only because that row is out of date.
 *
 * A row's email is copied from Keycloak only when its own account logs in. If
 * an account's email is changed in Keycloak and someone then registers with
 * the old address, the stale row blocks the new account's insert on
 * User_email_non_guest_key, and that person is logged in without a User row.
 * When the holder's Keycloak account now has a different email, the row is
 * brought up to date. Any other holder (deleted Keycloak account, or the same
 * email in Keycloak) is a real conflict and is left for an admin.
 */
async function releaseStaleEmail(client, kcAdminClient, email, userid, logger) {
  const { User: holders } = await client.request(FIND_EMAIL_HOLDERS, {
    email,
    id: userid,
  });
  for (const holder of holders) {
    const holderAccount = await kcAdminClient.users.findOne({ id: holder.id });
    const currentEmail = holderAccount?.email;
    if (currentEmail && currentEmail !== email) {
      const result = await client.request(SET_USER_EMAIL, { id: holder.id, email: currentEmail });
      // The holder was deleted after the lookup; its anonymized row must keep its placeholder email.
      if (result.update_User.affected_rows === 0) continue;
      logger.info(`Released ${email} for user ${userid}: user ${holder.id} now has its Keycloak email`);
    }
  }
}

const syncUser = async (req, logger) => {
  const userid = req.body.input.userid;

  const kcAdminClient = new KcAdminClient({
    baseUrl: keycloakConfig().url,
    realmName: 'master',
  });
  await authenticateKeycloakAdmin(kcAdminClient);
  kcAdminClient.setConfig({ realmName: 'edu-hub' });

  const user = await kcAdminClient.users.findOne({ id: userid });
  const client = createHasuraClient();

  let findUserResponse;
  try {
    const response = await client.request(FIND_USER, { id: userid });
    findUserResponse = response.User_by_pk;
  } catch (error) {
    // An unknown status could be a deleted account; never sync on a guess.
    logger.error('User lookup failed', { userid, error: error.message });
    return fail(500, 'User lookup failed');
  }

  // A still-valid token or a delayed login sync must never restore erased data.
  if (findUserResponse?.status === 'DELETED') {
    return fail(403, 'Account deleted', 'ACCOUNT_DELETED');
  }

  if (user == null) {
    return fail(404, 'User not found in Keycloak');
  }

  // Ensure matrix_user_handle is set in Keycloak (backfill for pre-SPI users).
  // A handle Hasura already stores wins over a freshly computed one: Hasura
  // keeps its handle below, and account deletion deactivates that one, so
  // Keycloak must end up with the same handle.
  const keycloakHandle = user.attributes?.matrix_user_handle?.[0] || null;
  const matrixHandle =
    keycloakHandle ||
    findUserResponse?.matrixUserHandle ||
    computeMatrixHandle(user.firstName, user.lastName, userid);
  if (!keycloakHandle) {
    try {
      await kcAdminClient.users.update(
        { id: userid },
        mergeUserPutPayload(user, {
          attributes: { ...(user.attributes || {}), matrix_user_handle: [matrixHandle] },
        })
      );
      logger.info(`Backfilled matrix_user_handle=${matrixHandle} for user ${userid}`);
    } catch (err) {
      logger.error(`Failed to backfill matrix_user_handle for user ${userid}`, { error: err.message });
    }
  }

  if (user.email) {
    try {
      await releaseStaleEmail(client, kcAdminClient, user.email, userid, logger);
    } catch (error) {
      logger.error(`Failed to check email holders for user ${userid}`, { error: error.message });
    }
  }

  try {
    if (!findUserResponse) {
      await client.request(INSERT_USER, {
        id: userid,
        firstname: user.firstName,
        lastname: user.lastName,
        email: user.email,
        matrixUserHandle: matrixHandle,
      });
    } else {
      // Only update matrixUserHandle if not already set in Hasura (immutable)
      const handleToSet = findUserResponse.matrixUserHandle || matrixHandle;

      const response = await client.request(UPDATE_USER, {
        id: userid,
        firstname: user.firstName,
        lastname: user.lastName,
        email: user.email,
        matrixUserHandle: handleToSet,
      });
      // The account was deleted after the status check above.
      if (response.update_User.affected_rows === 0) {
        return fail(403, 'Account deleted', 'ACCOUNT_DELETED');
      }
    }
  } catch (error) {
    // Reporting success here would leave the person logged in without a
    // User row, so every later write (e.g. a course application) fails.
    logger.error(`Could not sync user ${userid} from Keycloak`, { error: error.message });
    return fail(400, `Could not sync user ${userid} from Keycloak`);
  }

  // Note: Instructor role is now automatically assigned via event trigger when
  // a user is added as a CourseInstructor. The Expert table has been removed.
  // Super-admin lives solely in the `admin` role on the Keycloak `hasura` client
  // (read by getAdminUsers, written by updateAdminUser); the Admin table was
  // dropped in migration 1737451678001_drop_table_public_Admin.

  return { result: 'updateFromKeycloak function finished' };
};

/** @type {import('../lib/types.js').Handler} */
const updateFromKeycloak = async (req, logger) => {
  try {
    return await syncUser(req, logger);
  } catch (error) {
    // The old unit let Keycloak errors escape, which the platform answered
    // with a 500; keep that instead of the dispatcher's 200.
    logger.error('updateFromKeycloak failed', { error: error.message });
    return fail(500, 'Could not sync user from Keycloak');
  }
};

export default updateFromKeycloak;
