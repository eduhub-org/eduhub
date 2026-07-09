import KcAdminClient from "@keycloak/keycloak-admin-client";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
let secretsMatch, mergeUserPutPayload;
try {
  ({ secretsMatch } = require("./shared_libs/node/security.cjs"));
  ({ mergeUserPutPayload } = require("./shared_libs/node/keycloakUserMerge.cjs"));
} catch {
  ({ secretsMatch } = require("../shared_libs/node/security.cjs"));
  ({ mergeUserPutPayload } = require("../shared_libs/node/keycloakUserMerge.cjs"));
}
const { createClient } = require("graphqurl");

// ─── addKeycloakRole ────────────────────────────────────────────────────────
async function addKeycloakRole(req) {
  const kcAdminClient = new KcAdminClient({
    baseUrl: process.env.KEYCLOAK_URL,
    realmName: "master",
  });
  const userid = req.body.event.data.new.userId;
  const role = req.headers.role;

  await kcAdminClient.auth({
    username: process.env.KEYCLOAK_USER,
    password: process.env.KEYCLOAK_PW,
    grantType: "password",
    clientId: "admin-cli",
  });
  kcAdminClient.setConfig({ realmName: "edu-hub" });

  const hasura_client = await kcAdminClient.clients.find({
    clientId: "hasura",
    first: 1,
  });
  const available_roles = await kcAdminClient.users.listAvailableClientRoleMappings({
    id: userid,
    clientUniqueId: hasura_client[0].id,
  });
  const target_role = available_roles.filter((it) => it.name === role)[0];
  if (!target_role) {
    return { message: `Role '${role}' not available for user (already assigned or unknown)` };
  }
  await kcAdminClient.users.addClientRoleMappings({
    id: userid,
    clientUniqueId: hasura_client[0].id,
    roles: [{ id: target_role.id, name: target_role.name }],
  });
  return {};
}

// ─── removeKeycloakRole ─────────────────────────────────────────────────────
const REMAINING_GRANT_QUERIES = {
  org_admin: {
    field: "OrganizationAdmin",
    query: "query($id: uuid!) { OrganizationAdmin(where: {userId: {_eq: $id}}, limit: 1) { id } }",
  },
  instructor: {
    field: "CourseInstructor",
    query: "query($id: uuid!) { CourseInstructor(where: {userId: {_eq: $id}}, limit: 1) { id } }",
  },
};

async function removeKeycloakRole(req, res) {
  const userid = req.body?.event?.data?.old?.userId;
  const role = req.headers.role;

  if (!userid) {
    return res.status(400).json({ error: "No userId in event payload" });
  }
  if (!role) {
    return res.status(400).json({ error: "No role header provided" });
  }

  const remaining = REMAINING_GRANT_QUERIES[role];
  if (remaining) {
    const client = createClient({
      endpoint: process.env.HASURA_ENDPOINT,
      headers: {
        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
        "X-Hasura-Role": "admin",
      },
    });
    let stillGranted = null;
    try {
      const response = await client.query({
        query: remaining.query,
        variables: { id: userid },
      });
      stillGranted = response.data[remaining.field];
    } catch (error) {
      console.error(error);
    }
    if (stillGranted == null) {
      return res
        .status(500)
        .json({ error: "Could not verify remaining grants; role left unchanged" });
    }
    if (stillGranted.length > 0) {
      return res.json({
        message: `User still has ${stillGranted.length} ${remaining.field} grant(s); keeping '${role}' role`,
      });
    }
  }

  const kcAdminClient = new KcAdminClient({
    baseUrl: process.env.KEYCLOAK_URL,
    realmName: "master",
  });
  await kcAdminClient.auth({
    username: process.env.KEYCLOAK_USER,
    password: process.env.KEYCLOAK_PW,
    grantType: "password",
    clientId: "admin-cli",
  });
  kcAdminClient.setConfig({ realmName: "edu-hub" });

  const hasura_client = await kcAdminClient.clients.find({
    clientId: "hasura",
    first: 1,
  });
  if (!hasura_client?.[0]?.id) {
    return res.status(500).json({ error: "Keycloak client 'hasura' not found" });
  }

  const assigned_roles = await kcAdminClient.users.listClientRoleMappings({
    id: userid,
    clientUniqueId: hasura_client[0].id,
  });
  const target_role = assigned_roles.filter((it) => it.name === role)[0];
  if (!target_role) {
    return res.json({ message: `Role '${role}' not assigned to user; nothing to remove` });
  }
  await kcAdminClient.users.delClientRoleMappings({
    id: userid,
    clientUniqueId: hasura_client[0].id,
    roles: [{ id: target_role.id, name: target_role.name }],
  });
  return res.json({ message: `Role '${role}' removed from user` });
}

// ─── updateFromKeycloak ─────────────────────────────────────────────────────
function computeMatrixHandle(firstName, lastName, userId) {
  const sanitize = (input) => {
    const normalized = input.normalize("NFD").replace(/[̀-ͯ]/g, "");
    return normalized.toLowerCase().replace(/[^a-z0-9._\-]/g, "");
  };
  const first = sanitize(firstName || "user");
  const last = sanitize(lastName || "user");
  const uuidPrefix = (userId || "").replace(/-/g, "").substring(0, 6);
  return `${first}.${last}.${uuidPrefix}`;
}

async function updateFromKeycloak(req, res) {
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
  kcAdminClient.setConfig({ realmName: "edu-hub" });

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
    clientId: "hasura",
    first: 1,
  });
  const roles = await kcAdminClient.users.listClientRoleMappings({
    id: userid,
    clientUniqueId: hasura_client[0].id,
  });
  const admin_role = roles.filter((it) => it.name === "admin")[0];

  let findUserResponse;
  await client
    .query({
      query:
        "query($id : uuid!) { User_by_pk(id: $id) { id firstName matrixUserHandle } }",
      variables: { id: userid },
    })
    .then((response) => {
      findUserResponse = response.data.User_by_pk;
    })
    .catch((error) => console.error(error));

  if (user != null) {
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

    if (!findUserResponse || findUserResponse.length == 0) {
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
        .then(() => {})
        .catch((error) => console.error(error));
    } else {
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
        .then(() => {})
        .catch((error) => console.error(error));
    }

    if (admin_role != null) {
      let findAdminResponse;
      await client
        .query({
          query: "query($id : uuid!) { Admin(where: {userId: {_eq: $id}}) { id } }",
          variables: { id: userid },
        })
        .then((response) => {
          findAdminResponse = response.data.Admin;
        })
        .catch((error) => console.error(error));
      if (!findAdminResponse || findAdminResponse.length == 0) {
        await client
          .query({
            query:
              "mutation($id : uuid!) { insert_Admin(objects: {userId: $id}) { returning { id } } }",
            variables: { id: userid },
          })
          .then(() => {})
          .catch((error) => console.error(error));
      }
    }

    return res.json({ result: "updateFromKeycloak function finished" });
  }

  return res.status(401).json({ error: "Unauthorized" });
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────
const functionMap = {
  addKeycloakRole,
  removeKeycloakRole,
  updateFromKeycloak,
};

export const keycloakAdmin = async (req, res) => {
  const expectedSecret = process.env.HASURA_CLOUD_FUNCTION_SECRET;
  if (!expectedSecret) {
    return res.status(500).json({ error: "Server secret not configured" });
  }
  if (!secretsMatch(req.headers.secret, expectedSecret)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const functionName = req.headers.name;
  if (!functionName || !(functionName in functionMap)) {
    return res.status(404).json({ error: "Function Not Found" });
  }

  try {
    return await functionMap[functionName](req, res);
  } catch (error) {
    console.error(`Error in keycloakAdmin/${functionName}:`, error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};
