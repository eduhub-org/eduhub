/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SaveUserProfileImage
// ====================================================

export interface SaveUserProfileImage_saveUserProfileImage_resizedPaths {
  __typename: "resizedImagePath";
  size: number;
  filePath: string;
  accessUrl: string;
}

export interface SaveUserProfileImage_saveUserProfileImage {
  __typename: "saveImageResult";
  success: boolean;
  messageKey: string;
  error: string | null;
  filePath: string;
  accessUrl: string;
  resizedPaths: SaveUserProfileImage_saveUserProfileImage_resizedPaths[] | null;
}

export interface SaveUserProfileImage {
  saveUserProfileImage: SaveUserProfileImage_saveUserProfileImage;
}

export interface SaveUserProfileImageVariables {
  base64File: string;
  fileName: string;
  userId: string;
}
