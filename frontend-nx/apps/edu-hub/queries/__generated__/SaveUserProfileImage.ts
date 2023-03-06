/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SaveUserProfileImage
// ====================================================

export interface SaveUserProfileImage_saveUserProfileImage {
  __typename: "saveFileOutput";
  google_link: string;
  path: string;
}

export interface SaveUserProfileImage {
  saveUserProfileImage: SaveUserProfileImage_saveUserProfileImage | null;
}

export interface SaveUserProfileImageVariables {
  base64File: string;
  fileName: string;
  userId: string;
}
