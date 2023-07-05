/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: createAchievementCertificate
// ====================================================

export interface createAchievementCertificate_createAchievementCertificate {
  __typename: "createCertificateOutput";
  pdf: string;
}

export interface createAchievementCertificate {
  createAchievementCertificate: createAchievementCertificate_createAchievementCertificate | null;
}

export interface createAchievementCertificateVariables {
  template: string;
  firstname: string;
  lastname: string;
  semester: string;
  course_name: string;
  ects: string;
  practical_project: string;
  online_courses: string;
  certificate_text: string;
}
