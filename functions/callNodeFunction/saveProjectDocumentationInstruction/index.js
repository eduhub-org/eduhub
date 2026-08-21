import { GraphQLClient } from "graphql-request";
import saveFile from "../saveFile/index.js";

/**
 * Roles other than admin that may store an instruction PDF. The value is the
 * request role Hasura puts in session_variables (`instructor`), not the
 * inherited-role name used in actions.yaml permissions (`instructor_access`).
 */
const NON_ADMIN_ROLES = new Set(["instructor"]);

// saveFileResult declares filePath/accessUrl as String! (actions.graphql), so a
// failure response must still carry them: omitting them (or sending null) makes
// Hasura discard the whole payload with "expecting not null value for field
// filePath" and the messageKey never reaches the client. Callers check `success`
// first, so these are never read.
const FAILURE_DEFAULTS = { filePath: "", accessUrl: "" };

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

const GET_INSTRUCTION_OWNER = `
  query GetProjectDocumentationInstructionOwner($id: Int!) {
    ProjectDocumentationInstruction_by_pk(id: $id) {
      id
      isDefault
      createdByUserId
    }
  }
`;

/**
 * Stores the PDF of a ProjectDocumentationInstruction.
 *
 * The generic saveFile handler derives the storage object key from the
 * `projectDocumentationInstructionId` input and never checks who owns that row.
 * Since instructors can read the `url` of every instruction they can see, calling
 * saveFile directly would let one instructor overwrite another instruction's PDF -
 * including admin-uploaded files that students download. This wrapper therefore
 * verifies ownership before delegating; storage behaviour itself is unchanged.
 */
export default async function saveProjectDocumentationInstruction(req, logger) {
  logger.info("########## Save Project Documentation Instruction ##########");

  const sessionVariables = req.body?.session_variables || {};
  const role = sessionVariables["x-hasura-role"];
  const userId = sessionVariables["x-hasura-user-id"];

  const instructionId = Number(req.body?.input?.projectDocumentationInstructionId);
  if (!Number.isInteger(instructionId) || instructionId <= 0) {
    return {
      success: false,
      messageKey: "INVALID_INPUT",
      error: "projectDocumentationInstructionId must be a positive integer",
      ...FAILURE_DEFAULTS,
    };
  }

  // Admins manage the whole catalogue; everyone else must own the target row.
  if (role !== "admin") {
    if (!NON_ADMIN_ROLES.has(role) || !userId) {
      return {
        success: false,
        messageKey: "SAVE_PROJECT_DOCUMENTATION_INSTRUCTION_UNAUTHORIZED",
        error: "Only admins and instructors may store instruction PDFs",
        ...FAILURE_DEFAULTS,
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
        ...FAILURE_DEFAULTS,
      };
    }

    let instruction;
    try {
      const lookup = await hasuraClient.request({
        document: GET_INSTRUCTION_OWNER,
        variables: { id: instructionId },
      });
      instruction = lookup?.ProjectDocumentationInstruction_by_pk;
    } catch (error) {
      logger.error("Failed to look up documentation instruction", {
        error: error.message,
      });
      return {
        success: false,
        messageKey: "SAVE_PROJECT_DOCUMENTATION_INSTRUCTION_LOOKUP_FAILED",
        error: "Could not load the requested documentation instruction",
        ...FAILURE_DEFAULTS,
      };
    }

    if (!instruction) {
      return {
        success: false,
        messageKey: "SAVE_PROJECT_DOCUMENTATION_INSTRUCTION_NOT_FOUND",
        error: "Documentation instruction not found",
        ...FAILURE_DEFAULTS,
      };
    }

    // Defaults belong to the platform catalogue even when an admin promoted an
    // instructor-created row, so they are never writable by a non-admin.
    if (instruction.isDefault || instruction.createdByUserId !== userId) {
      logger.error("Instruction does not belong to the caller", {
        instructionId,
        role,
      });
      return {
        success: false,
        messageKey: "SAVE_PROJECT_DOCUMENTATION_INSTRUCTION_UNAUTHORIZED",
        error: "You may only upload PDFs for documentation instructions you created",
        ...FAILURE_DEFAULTS,
      };
    }
  }

  return saveFile(req, logger);
}
