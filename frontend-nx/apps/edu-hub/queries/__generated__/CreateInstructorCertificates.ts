/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: CreateInstructorCertificates
// ====================================================

export interface CreateInstructorCertificates_createInstructorCertificates {
  __typename: "CreateInstructorCertificatesResult";
  success: boolean;
  count: number | null;
  skippedCourseIds: number[] | null;
  error: string | null;
  messageKey: string;
}

export interface CreateInstructorCertificates {
  /**
   * Renders the instructor certificates of the given courses from the program templates
   */
  createInstructorCertificates: CreateInstructorCertificates_createInstructorCertificates;
}

export interface CreateInstructorCertificatesVariables {
  courseIds: number[];
}
