/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SaveProjectImage
// ====================================================

export interface SaveProjectImage_saveProjectImage_resizedPaths {
  __typename: "resizedImagePath";
  size: number;
  filePath: string;
  accessUrl: string;
}

export interface SaveProjectImage_saveProjectImage {
  __typename: "saveImageResult";
  success: boolean;
  messageKey: string;
  error: string | null;
  filePath: string;
  accessUrl: string;
  resizedPaths: SaveProjectImage_saveProjectImage_resizedPaths[] | null;
}

export interface SaveProjectImage {
  saveProjectImage: SaveProjectImage_saveProjectImage | null;
}

export interface SaveProjectImageVariables {
  base64File: string;
  fileName: string;
  projectId: number;
}
