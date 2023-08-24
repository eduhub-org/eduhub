/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: createCertificate
// ====================================================

export interface createCertificate_createCertificate {
  __typename: "result";
  result: string;
}

export interface createCertificate {
  /**
   * Generates a certificate of a given type for a given course and user id
   */
  createCertificate: createCertificate_createCertificate | null;
}

export interface createCertificateVariables {
  userIds: any[];
  courseId: number;
  certificateType: string;
}
