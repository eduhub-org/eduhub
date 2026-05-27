/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SaveProjectPresentation
// ====================================================

export interface SaveProjectPresentation_saveProjectPresentation {
  __typename: "saveFileResult";
  success: boolean;
  messageKey: string;
  error: string | null;
  filePath: string;
  accessUrl: string;
}

export interface SaveProjectPresentation {
  saveProjectPresentation: SaveProjectPresentation_saveProjectPresentation | null;
}

export interface SaveProjectPresentationVariables {
  base64File: string;
  fileName: string;
  projectId: number;
}
