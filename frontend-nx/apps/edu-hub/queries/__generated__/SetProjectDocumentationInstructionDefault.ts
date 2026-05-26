/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SetProjectDocumentationInstructionDefault
// ====================================================

export interface SetProjectDocumentationInstructionDefault_setProjectDocumentationInstructionDefault {
  __typename: "SetProjectDocumentationInstructionDefaultResult";
  success: boolean;
  messageKey: string;
  error: string | null;
  projectTypeValue: string | null;
}

export interface SetProjectDocumentationInstructionDefault {
  /**
   * Atomically promotes one ProjectDocumentationInstruction to the default for its projectTypeValue, demoting whichever row was previously default for the same type.
   */
  setProjectDocumentationInstructionDefault: SetProjectDocumentationInstructionDefault_setProjectDocumentationInstructionDefault;
}

export interface SetProjectDocumentationInstructionDefaultVariables {
  instructionId: number;
}
