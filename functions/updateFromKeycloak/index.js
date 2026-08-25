import KcAdminClient from "@keycloak/keycloak-admin-client";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

let mergeUserPutPayload;
try {
  ({ mergeUserPutPayload } = require("./shared_libs/node/keycloakUserMerge.cjs"));
} catch {
  ({ mergeUserPutPayload } = require("../shared_libs/node/keycloakUserMerge.cjs"));
}

const { createClient } = require("graphqurl");
let secretsMatch;
try {
  ({ secretsMatch } = require("./shared_libs/node/security.cjs"));
} catch {
  ({ secretsMatch } = require("../shared_libs/node/security.cjs"));
}

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
    const access_key = req.body.input.access_key;
    
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
    const client = createClient({
      endpoint: process.env.HASURA_ENDPOINT,
      headers: {
        "x-access-key": process.env.HASURA_ADMIN_SECRET,
        "X-Hasura-Role": "admin",
        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
      },
    });
    
    const hasura_client = await kcAdminClient.clients.find({
      clientId: 'hasura',
      first: 1,
    });
    
    const roles = await kcAdminClient.users.listClientRoleMappings({
      id: userid,
      clientUniqueId: hasura_client[0].id,
    });
    
    const admin_role = roles.filter(it => it.name === 'admin')[0];

    let findUserResponse;
    await client
      .query({
        query: "query($id : uuid!) { User_by_pk(id: $id) { id firstName matrixUserHandle } }",
        variables: { id: userid },
      })
      .then((response) => {
        findUserResponse = response.data.User_by_pk;
      })
      .catch((error) => console.error(error));
    
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
        await client
          .query({
            query:
              "mutation($id : uuid!, $firstname : String, $lastname : String, $email : String, $matrixUserHandle : String) { insert_User(objects: {id: $id, firstName: $firstname, lastName: $lastname, email: $email, matrixUserHandle: $matrixUserHandle}) { returning { id } } }",
            variables: {
              id: userid,
              firstname: user.firstName,
              lastname: user.lastName,
              email: user.email,
              matrixUserHandle: matrixHandle,
            },
          })
          .then((response) => {})
          .catch((error) => console.error(error));
      } else {
        // Only update matrixUserHandle if not already set in Hasura (immutable)
        const existingHandle = findUserResponse.matrixUserHandle;
        const handleToSet = existingHandle || matrixHandle;

        await client
          .query({
            query:
              "mutation($id : uuid!, $firstname : String, $lastname : String, $email : String, $matrixUserHandle : String) { update_User_by_pk(pk_columns: {id: $id}, _set: {firstName: $firstname, lastName: $lastname, email: $email, matrixUserHandle: $matrixUserHandle}) { id  } }",
            variables: {
              id: userid,
              firstname: user.firstName,
              lastname: user.lastName,
              email: user.email,
              matrixUserHandle: handleToSet,
            },
          })
          .then((response) => {})
          .catch((error) => console.error(error));
      }
      
      // Note: Instructor role is now automatically assigned via event trigger when
      // a user is added as a CourseInstructor. The Expert table has been removed.
      
      let findAdminResponse;
      if (admin_role != null) { 
        await client
          .query({
            query: "query($id : uuid!) { Admin(where: {userId: {_eq: $id}}) { id } }",
            variables: { id: userid },
          })
          .then((response) => {
            findAdminResponse = response.data.Admin;
          })
          .catch((error) => console.error(error));
        if (!findAdminResponse || (findAdminResponse.length == 0)) {
          await client
          .query({
            query:
              "mutation($id : uuid!) { insert_Admin(objects: {userId: $id}) { returning { id } } }",
            variables: {
              id: userid
            },
          })
          .then((response) => {})
          .catch((error) => console.error(error));
        }
      }

      return res.json({
        result: "updateFromKeycloak function finished",
      });
    }
  }

  return res.status(401).json({ error: "Unauthorized" });
};
