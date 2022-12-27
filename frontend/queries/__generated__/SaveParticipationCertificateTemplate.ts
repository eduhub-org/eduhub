/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SaveParticipationCertificateTemplate
// ====================================================

export interface SaveParticipationCertificateTemplate_saveParticipationCertificateTemplate {
  __typename: "saveFileOutput";
  google_link: string;
  path: string;
}

export interface SaveParticipationCertificateTemplate {
  saveParticipationCertificateTemplate: SaveParticipationCertificateTemplate_saveParticipationCertificateTemplate | null;
}

export interface SaveParticipationCertificateTemplateVariables {
  base64File: string;
  fileName: string;
  programId: number;
}
