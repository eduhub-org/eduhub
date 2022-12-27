/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SaveAchievementCertificateTemplate
// ====================================================

export interface SaveAchievementCertificateTemplate_saveAchievementCertificateTemplate {
  __typename: "saveFileOutput";
  google_link: string;
  path: string;
}

export interface SaveAchievementCertificateTemplate {
  saveAchievementCertificateTemplate: SaveAchievementCertificateTemplate_saveAchievementCertificateTemplate | null;
}

export interface SaveAchievementCertificateTemplateVariables {
  base64File: string;
  fileName: string;
  programId: number;
}
