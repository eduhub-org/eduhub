/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SaveAchievementCertificateTemplate
// ====================================================

export interface SaveAchievementCertificateTemplate_saveAchievementCertificateTemplate {
  __typename: "saveFileResult";
  success: boolean;
  messageKey: string;
  error: string | null;
  filePath: string;
  accessUrl: string;
}

export interface SaveAchievementCertificateTemplate {
  saveAchievementCertificateTemplate: SaveAchievementCertificateTemplate_saveAchievementCertificateTemplate | null;
}

export interface SaveAchievementCertificateTemplateVariables {
  base64File: string;
  fileName: string;
  programId: number;
}
