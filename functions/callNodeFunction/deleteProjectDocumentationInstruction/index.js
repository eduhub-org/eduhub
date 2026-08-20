import { GraphQLClient } from "graphql-request";

// Request roles from session_variables, not the inherited-role names used in
// actions.yaml permissions. Instructors are additionally limited to instructions
// they created (checked below).
const ALLOWED_ROLES = new Set(["admin", "instructor"]);

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

const GET_INSTRUCTION = `
  query GetProjectDocumentationInstructionForDelete($id: Int!) {
    ProjectDocumentationInstruction_by_pk(id: $id) {
      id
      projectTypeValue
      isDefault
      createdByUserId
    }
  }
`;

const GET_DEFAULT_FOR_TYPE = `
  query GetDefaultProjectDocumentationInstruction($projectTypeValue: String!) {
    ProjectDocumentationInstruction(
      where: {
        projectTypeValue: { _eq: $projectTypeValue }
        isDefault: { _eq: true }
      }
      limit: 1
    ) {
      id
    }
  }
`;

const REASSIGN_AND_DELETE = `
  mutation ReassignProjectsAndDeleteInstruction(
    $instructionId: Int!
    $defaultInstructionId: Int!
  ) {
    update_Project(
      where: { documentationInstructionId: { _eq: $instructionId } }
      _set: { documentationInstructionId: $defaultInstructionId }
    ) {
      affected_rows
    }
    delete_ProjectDocumentationInstruction_by_pk(id: $instructionId) {
      id
    }
  }
`;

export default async function deleteProjectDocumentationInstruction(req, logger) {
  logger.info("########## Delete Project Documentation Instruction ##########");

  const role = req.body?.session_variables?.["x-hasura-role"];
  if (!ALLOWED_ROLES.has(role)) {
    return {
      success: false,
      messageKey: "DELETE_PROJECT_DOCUMENTATION_INSTRUCTION_UNAUTHORIZED",
      error: "Only admins and instructors may delete documentation instructions",
      reassignedProjectCount: 0,
    };
  }

  const input = req.body?.input || {};
  const instructionId = Number(input.instructionId);
  if (!Number.isInteger(instructionId) || instructionId <= 0) {
    return {
      success: false,
      messageKey: "DELETE_PROJECT_DOCUMENTATION_INSTRUCTION_INVALID_INPUT",
      error: "instructionId must be a positive integer",
      reassignedProjectCount: 0,
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
      reassignedProjectCount: 0,
    };
  }

  let instruction;
  try {
    const lookup = await hasuraClient.request({
      document: GET_INSTRUCTION,
      variables: { id: instructionId },
    });
    instruction = lookup?.ProjectDocumentationInstruction_by_pk;
    if (!instruction) {
      return {
        success: false,
        messageKey: "DELETE_PROJECT_DOCUMENTATION_INSTRUCTION_NOT_FOUND",
        error: "Documentation instruction not found",
        reassignedProjectCount: 0,
      };
    }
    if (instruction.isDefault) {
      return {
        success: false,
        messageKey: "DELETE_PROJECT_DOCUMENTATION_INSTRUCTION_IS_DEFAULT",
        error: "Default instructions cannot be deleted",
        reassignedProjectCount: 0,
      };
    }
    // Admins manage the whole catalogue; an instructor may only delete what they
    // created. Platform rows (createdByUserId IS NULL) are therefore off limits.
    const callerUserId = req.body?.session_variables?.["x-hasura-user-id"];
    if (role !== "admin" && instruction.createdByUserId !== callerUserId) {
      logger.error("Instruction does not belong to the caller", {
        instructionId,
        role,
      });
      return {
        success: false,
        messageKey: "DELETE_PROJECT_DOCUMENTATION_INSTRUCTION_FORBIDDEN",
        error: "You may only delete documentation instructions you created",
        reassignedProjectCount: 0,
      };
    }
  } catch (error) {
    logger.error("Failed to look up documentation instruction", { error: error.message });
    return {
      success: false,
      messageKey: "DELETE_PROJECT_DOCUMENTATION_INSTRUCTION_LOOKUP_FAILED",
      error: "Could not load the requested documentation instruction",
      reassignedProjectCount: 0,
    };
  }

  let defaultInstructionId;
  try {
    const defaults = await hasuraClient.request({
      document: GET_DEFAULT_FOR_TYPE,
      variables: { projectTypeValue: instruction.projectTypeValue },
    });
    defaultInstructionId = defaults?.ProjectDocumentationInstruction?.[0]?.id;
    if (!defaultInstructionId) {
      return {
        success: false,
        messageKey: "DELETE_PROJECT_DOCUMENTATION_INSTRUCTION_NO_DEFAULT",
        error: "No default instruction exists for this project type",
        reassignedProjectCount: 0,
      };
    }
  } catch (error) {
    logger.error("Failed to look up default instruction", { error: error.message });
    return {
      success: false,
      messageKey: "DELETE_PROJECT_DOCUMENTATION_INSTRUCTION_DEFAULT_LOOKUP_FAILED",
      error: "Could not find the default instruction for this project type",
      reassignedProjectCount: 0,
    };
  }

  try {
    const result = await hasuraClient.request({
      document: REASSIGN_AND_DELETE,
      variables: { instructionId, defaultInstructionId },
    });
    const reassignedProjectCount = result?.update_Project?.affected_rows ?? 0;
    if (!result?.delete_ProjectDocumentationInstruction_by_pk?.id) {
      return {
        success: false,
        messageKey: "DELETE_PROJECT_DOCUMENTATION_INSTRUCTION_FAILED",
        error: "The instruction could not be deleted",
        reassignedProjectCount,
      };
    }
    return {
      success: true,
      messageKey: "DELETE_PROJECT_DOCUMENTATION_INSTRUCTION_OK",
      reassignedProjectCount,
    };
  } catch (error) {
    logger.error("Failed to reassign projects and delete instruction", {
      error: error.message,
    });
    return {
      success: false,
      messageKey: "DELETE_PROJECT_DOCUMENTATION_INSTRUCTION_FAILED",
      error: error.message,
      reassignedProjectCount: 0,
    };
  }
}
