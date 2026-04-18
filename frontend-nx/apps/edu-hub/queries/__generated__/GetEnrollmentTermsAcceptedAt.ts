/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetEnrollmentTermsAcceptedAt
// ====================================================

export interface GetEnrollmentTermsAcceptedAt_CourseEnrollment_by_pk {
  __typename: "CourseEnrollment";
  id: number;
  /**
   * Timestamp when user accepted Terms & Conditions and Privacy Policy during registration
   */
  termsAcceptedAt: any | null;
}

export interface GetEnrollmentTermsAcceptedAt {
  /**
   * fetch data from the table: "CourseEnrollment" using primary key columns
   */
  CourseEnrollment_by_pk: GetEnrollmentTermsAcceptedAt_CourseEnrollment_by_pk | null;
}

export interface GetEnrollmentTermsAcceptedAtVariables {
  enrollmentId: number;
}
