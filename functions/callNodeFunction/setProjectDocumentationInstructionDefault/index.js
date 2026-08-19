import { GraphQLClient } from "graphql-request";

const ALLOWED_ROLES = new Set(["admin"]);

const ensureHasuraClient = () => {
  if (!process.env.HASURA_ENDPOINT || !process.env.HASURA_ADMIN_SECRET) {
    throw new Error("HASURA_ENDPOINT or HASURA_ADMIN_SECRET not configured");
  }
  return new GraphQLClient(process.env.HASURA_ENDPOINT, {
    headers: {
      "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
    },
  });
};

const GET_INSTRUCTION_TYPE = `
  query GetProjectDocumentationInstructionType($id: Int!) {
    ProjectDocumentationInstruction_by_pk(id: $id) {
      id
      projectTypeValue
      createdByUserId
    }
  }
`;

// One UPDATE statement covering both the promoted and demoted rows keeps the
// partial unique index (one default per projectTypeValue) satisfied at every
// point in the transaction.
const SWAP_DEFAULT = `
  mutation SwapProjectDocumentationInstructionDefault(
    $instructionId: Int!
    $projectTypeValue: String!
  ) {
    update_ProjectDocumentationInstruction(
      where: { projectTypeValue: { _eq: $projectTypeValue } }
      _set: { isDefault: false }
    ) {
      affected_rows
    }
    set_new_default: update_ProjectDocumentationInstruction_by_pk(
      pk_columns: { id: $instructionId }
      _set: { isDefault: true }
    ) {
      id
      projectTypeValue
      isDefault
    }
  }
`;

export default async function setProjectDocumentationInstructionDefault(req, logger) {
  logger.info("########## Set Project Documentation Instruction Default ##########");

  const role = req.body?.session_variables?.["x-hasura-role"];
  if (!ALLOWED_ROLES.has(role)) {
    return {
      success: false,
      messageKey: "SET_PROJECT_DOCUMENTATION_INSTRUCTION_DEFAULT_UNAUTHORIZED",
      error: "Only admin users may change documentation-instruction defaults",
    };
  }

  const input = req.body?.input || {};
  const instructionId = Number(input.instructionId);
  if (!Number.isInteger(instructionId) || instructionId <= 0) {
    return {
      success: false,
      messageKey: "SET_PROJECT_DOCUMENTATION_INSTRUCTION_DEFAULT_INVALID_INPUT",
      error: "instructionId must be a positive integer",
    };
  }

  let hasuraClient;
  try {
    hasuraClient = ensureHasuraClient();
  } catch (error) {
    logger.error("Hasura client misconfigured", { error: error.message });
    return {
      success: false,
      messageKey: "SERVER_MISCONFIGURED",
      error: error.message,
    };
  }

  let projectTypeValue;
  try {
    const lookup = await hasuraClient.request({
      document: GET_INSTRUCTION_TYPE,
      variables: { id: instructionId },
    });
    const row = lookup?.ProjectDocumentationInstruction_by_pk;
    if (!row) {
      return {
        success: false,
        messageKey: "SET_PROJECT_DOCUMENTATION_INSTRUCTION_DEFAULT_NOT_FOUND",
        error: "Documentation instruction not found",
      };
    }
    // A type default is part of the platform catalogue and must stay visible to
    // every instructor. Promoting a personal upload (createdByUserId IS NOT NULL)
    // would make a type's only default invisible to everyone but its creator, and
    // would also take the row out of its owner's control (the update and delete
    // permissions both exclude isDefault rows).
    if (row.createdByUserId) {
      return {
        success: false,
        messageKey: "SET_PROJECT_DOCUMENTATION_INSTRUCTION_DEFAULT_NOT_PLATFORM",
        error:
          "Only platform instructions can become a type default; this one belongs to an instructor",
      };
    }
    projectTypeValue = row.projectTypeValue;
  } catch (error) {
    logger.error("Failed to look up documentation instruction", { error: error.message });
    return {
      success: false,
      messageKey: "SET_PROJECT_DOCUMENTATION_INSTRUCTION_DEFAULT_LOOKUP_FAILED",
      error: "Could not load the requested documentation instruction",
    };
  }

  try {
    await hasuraClient.request({
      document: SWAP_DEFAULT,
      variables: { instructionId, projectTypeValue },
    });

    return {
      success: true,
      messageKey: "SET_PROJECT_DOCUMENTATION_INSTRUCTION_DEFAULT_OK",
      projectTypeValue,
    };
  } catch (error) {
    logger.error("Failed to swap documentation-instruction default", {
      error: error.message,
    });
    return {
      success: false,
      messageKey: "SET_PROJECT_DOCUMENTATION_INSTRUCTION_DEFAULT_FAILED",
      error: error.message,
    };
  }
}
