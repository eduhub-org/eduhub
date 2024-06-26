/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: createCertificates
// ====================================================

export interface createCertificates_createCertificate {
  __typename: "result";
  result: string;
}

export interface createCertificates {
  /**
   * Generates a certificate of a given type for a given course and user id
   */
  createCertificate: createCertificates_createCertificate | null;
}

export interface createCertificatesVariables {
  userIds: any[];
  courseId: number;
  certificateType: string;
}
