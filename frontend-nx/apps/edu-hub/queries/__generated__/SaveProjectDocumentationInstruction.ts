/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SaveProjectDocumentationInstruction
// ====================================================

export interface SaveProjectDocumentationInstruction_saveProjectDocumentationInstruction {
  __typename: "saveFileResult";
  success: boolean;
  messageKey: string;
  error: string | null;
  filePath: string;
  accessUrl: string;
}

export interface SaveProjectDocumentationInstruction {
  saveProjectDocumentationInstruction: SaveProjectDocumentationInstruction_saveProjectDocumentationInstruction | null;
}

export interface SaveProjectDocumentationInstructionVariables {
  base64File: string;
  fileName: string;
  projectDocumentationInstructionId: number;
}
