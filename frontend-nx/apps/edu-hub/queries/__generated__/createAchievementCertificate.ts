/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: createAchievementCertificate
// ====================================================

export interface createAchievementCertificate_createAchievementCertificate {
  __typename: "result";
  result: string;
}

export interface createAchievementCertificate {
  createAchievementCertificate: createAchievementCertificate_createAchievementCertificate | null;
}

export interface createAchievementCertificateVariables {
  userIds: any[];
  courseId: number;
}
