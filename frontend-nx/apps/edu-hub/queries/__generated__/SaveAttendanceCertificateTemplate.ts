/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SaveAttendanceCertificateTemplate
// ====================================================

export interface SaveAttendanceCertificateTemplate_saveAttendanceCertificateTemplate {
  __typename: "saveFileOutput";
  google_link: string;
  path: string;
}

export interface SaveAttendanceCertificateTemplate {
  saveAttendanceCertificateTemplate: SaveAttendanceCertificateTemplate_saveAttendanceCertificateTemplate | null;
}

export interface SaveAttendanceCertificateTemplateVariables {
  base64File: string;
  fileName: string;
  programId: number;
}
