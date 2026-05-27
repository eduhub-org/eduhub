/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SaveProjectDocumentation
// ====================================================

export interface SaveProjectDocumentation_saveProjectDocumentation {
  __typename: "saveFileResult";
  success: boolean;
  messageKey: string;
  error: string | null;
  filePath: string;
  accessUrl: string;
}

export interface SaveProjectDocumentation {
  saveProjectDocumentation: SaveProjectDocumentation_saveProjectDocumentation | null;
}

export interface SaveProjectDocumentationVariables {
  base64File: string;
  fileName: string;
  projectId: number;
}
