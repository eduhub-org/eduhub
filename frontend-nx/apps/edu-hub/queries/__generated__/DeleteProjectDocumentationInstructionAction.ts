/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteProjectDocumentationInstructionAction
// ====================================================

export interface DeleteProjectDocumentationInstructionAction_deleteProjectDocumentationInstruction {
  __typename: "DeleteProjectDocumentationInstructionResult";
  success: boolean;
  messageKey: string;
  error: string | null;
  reassignedProjectCount: number | null;
}

export interface DeleteProjectDocumentationInstructionAction {
  /**
   * Reassigns projects using the instruction to the type default, then deletes the non-default instruction. Instructors may only delete instructions they created (verified in the handler).
   */
  deleteProjectDocumentationInstruction: DeleteProjectDocumentationInstructionAction_deleteProjectDocumentationInstruction;
}

export interface DeleteProjectDocumentationInstructionActionVariables {
  instructionId: number;
}
