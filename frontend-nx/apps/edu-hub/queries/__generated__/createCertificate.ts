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
   * Generates a certificate of the given type for the given course and id
   */
  createCertificate: createCertificate_createCertificate | null;
}

export interface createCertificateVariables {
  userIds: any[];
  courseId: number;
  certificateType: string;
}
