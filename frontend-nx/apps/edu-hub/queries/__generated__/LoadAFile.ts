/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: LoadAFile
// ====================================================

export interface LoadAFile_loadAchievementCertificate {
  __typename: "loadFileOutput";
  link: string;
}

export interface LoadAFile {
  loadAchievementCertificate: LoadAFile_loadAchievementCertificate | null;
}

export interface LoadAFileVariables {
  path: string;
}
