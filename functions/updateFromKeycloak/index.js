import KcAdminClient from "@keycloak/keycloak-admin-client";
import { GraphQLClient, gql } from "graphql-request";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

let mergeUserPutPayload;
try {
  ({ mergeUserPutPayload } = require("./shared_libs/node/keycloakUserMerge.cjs"));
} catch {
  ({ mergeUserPutPayload } = require("../shared_libs/node/keycloakUserMerge.cjs"));
}

let computeMatrixHandle;
try {
  ({ computeMatrixHandle } = require("./shared_libs/node/matrixHandle.cjs"));
} catch {
  ({ computeMatrixHandle } = require("../shared_libs/node/matrixHandle.cjs"));
}

let secretsMatch;
try {
  ({ secretsMatch } = require("./shared_libs/node/security.cjs"));
} catch {
  ({ secretsMatch } = require("../shared_libs/node/security.cjs"));
}

const FIND_USER = gql`
  query ($id: uuid!) {
    User_by_pk(id: $id) {
      id
      firstName
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
    update_User_by_pk(
      pk_columns: { id: $id }
      _set: {
        firstName: $firstname
        lastName: $lastname
        email: $email
        matrixUserHandle: $matrixUserHandle
      }
    ) {
      id
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
    update_User_by_pk(pk_columns: { id: $id }, _set: { email: $email }) {
      id
    }
  }
`;

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
async function releaseStaleEmail(client, kcAdminClient, email, userid) {
  const { User: holders } = await client.request(FIND_EMAIL_HOLDERS, {
    email,
    id: userid,
  });
  for (const holder of holders) {
    const holderAccount = await kcAdminClient.users.findOne({ id: holder.id });
    const currentEmail = holderAccount?.email;
    if (currentEmail && currentEmail !== email) {
      await client.request(SET_USER_EMAIL, { id: holder.id, email: currentEmail });
      console.log(
        `Released ${email} for user ${userid}: user ${holder.id} now has its Keycloak email`
      );
    }
  }
}

export const updateFromKeycloak = async (req, res) => {
  const expectedSecret = process.env.HASURA_CLOUD_FUNCTION_SECRET;
  if (!expectedSecret) {
    return res.status(500).json({ error: "Server secret not configured" });
  }

  if (secretsMatch(req.headers.secret, expectedSecret)) {
    const kcAdminClient = new KcAdminClient({
      baseUrl: process.env.KEYCLOAK_URL,
      realmName: "master",
    });

    const userid = req.body.input.userid;

    await kcAdminClient.auth({
      username: process.env.KEYCLOAK_USER || "keycloak",
      password: process.env.KEYCLOAK_PW,
      grantType: "password",
      clientId: "admin-cli",
    });
    kcAdminClient.setConfig({
      realmName: "edu-hub",
    });

    let user = await kcAdminClient.users.findOne({ id: userid });
    const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
      headers: {
        "X-Hasura-Role": "admin",
        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
      },
    });

    let findUserResponse;
    try {
      const response = await client.request(FIND_USER, { id: userid });
      findUserResponse = response.User_by_pk;
    } catch (error) {
      console.error(error);
    }

    if (user != null) {
      // Ensure matrix_user_handle is set in Keycloak (backfill for pre-SPI users)
      let matrixHandle = user.attributes?.matrix_user_handle?.[0] || null;
      if (!matrixHandle) {
        matrixHandle = computeMatrixHandle(user.firstName, user.lastName, userid);
        try {
          await kcAdminClient.users.update(
            { id: userid },
            mergeUserPutPayload(user, {
              attributes: { ...(user.attributes || {}), matrix_user_handle: [matrixHandle] },
            })
          );
          console.log(`Backfilled matrix_user_handle=${matrixHandle} for user ${userid}`);
        } catch (err) {
          console.error(`Failed to backfill matrix_user_handle for user ${userid}:`, err);
        }
      }

      if (user.email) {
        try {
          await releaseStaleEmail(client, kcAdminClient, user.email, userid);
        } catch (error) {
          console.error(`Failed to check email holders for user ${userid}:`, error);
        }
      }

      try {
        if (!findUserResponse || (findUserResponse.length == 0)) {
          await client.request(INSERT_USER, {
            id: userid,
            firstname: user.firstName,
            lastname: user.lastName,
            email: user.email,
            matrixUserHandle: matrixHandle,
          });
        } else {
          // Only update matrixUserHandle if not already set in Hasura (immutable)
          const existingHandle = findUserResponse.matrixUserHandle;
          const handleToSet = existingHandle || matrixHandle;

          await client.request(UPDATE_USER, {
            id: userid,
            firstname: user.firstName,
            lastname: user.lastName,
            email: user.email,
            matrixUserHandle: handleToSet,
          });
        }
      } catch (error) {
        // Reporting success here would leave the person logged in without a
        // User row, so every later write (e.g. a course application) fails.
        console.error(error);
        return res.status(400).json({
          message: `Could not sync user ${userid} from Keycloak`,
        });
      }

      // Note: Instructor role is now automatically assigned via event trigger when
      // a user is added as a CourseInstructor. The Expert table has been removed.
      // Super-admin lives solely in the `admin` role on the Keycloak `hasura` client
      // (read by getAdminUsers, written by updateAdminUser); the Admin table was
      // dropped in migration 1737451678001_drop_table_public_Admin.

      return res.json({
        result: "updateFromKeycloak function finished",
      });
    }
  }

  return res.status(401).json({ error: "Unauthorized" });
};
