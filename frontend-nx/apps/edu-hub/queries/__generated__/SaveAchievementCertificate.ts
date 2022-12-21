/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SaveAchievementCertificate
// ====================================================

export interface SaveAchievementCertificate_saveAchievementCertificate {
  __typename: "loadFileOutput";
  link: string;
}

export interface SaveAchievementCertificate {
  saveAchievementCertificate: SaveAchievementCertificate_saveAchievementCertificate | null;
}

export interface SaveAchievementCertificateVariables {
  base64File: string;
  courseId: number;
  userId: string;
}
