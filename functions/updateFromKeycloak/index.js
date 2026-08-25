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

function computeMatrixHandle(firstName, lastName, userId) {
  const sanitize = (input) => {
    const normalized = input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalized.toLowerCase().replace(/[^a-z0-9._\-]/g, '');
  };
  const first = sanitize(firstName || 'user');
  const last = sanitize(lastName || 'user');
  const uuidPrefix = (userId || '').replace(/-/g, '').substring(0, 6);
  return `${first}.${last}.${uuidPrefix}`;
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

      if (!findUserResponse || (findUserResponse.length == 0)) {
        try {
          await client.request(INSERT_USER, {
            id: userid,
            firstname: user.firstName,
            lastname: user.lastName,
            email: user.email,
            matrixUserHandle: matrixHandle,
          });
        } catch (error) {
          console.error(error);
        }
      } else {
        // Only update matrixUserHandle if not already set in Hasura (immutable)
        const existingHandle = findUserResponse.matrixUserHandle;
        const handleToSet = existingHandle || matrixHandle;

        try {
          await client.request(UPDATE_USER, {
            id: userid,
            firstname: user.firstName,
            lastname: user.lastName,
            email: user.email,
            matrixUserHandle: handleToSet,
          });
        } catch (error) {
          console.error(error);
        }
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
