/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: createCertificates
// ====================================================

export interface createCertificates_createCertificates {
  __typename: "CreateCertificatesResult";
  success: boolean;
  count: number | null;
  certificateType: string | null;
  error: string | null;
  messageKey: string;
}

export interface createCertificates {
  /**
   * createCertificates
   */
  createCertificates: createCertificates_createCertificates;
}

export interface createCertificatesVariables {
  userIds: any[];
  courseId: number;
  certificateType: string;
}
