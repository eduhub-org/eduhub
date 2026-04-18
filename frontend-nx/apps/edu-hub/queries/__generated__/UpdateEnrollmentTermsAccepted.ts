/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateEnrollmentTermsAccepted
// ====================================================

export interface UpdateEnrollmentTermsAccepted_update_CourseEnrollment_returning {
  __typename: "CourseEnrollment";
  id: number;
  /**
   * Timestamp when user accepted Terms & Conditions and Privacy Policy during registration
   */
  termsAcceptedAt: any | null;
}

export interface UpdateEnrollmentTermsAccepted_update_CourseEnrollment {
  __typename: "CourseEnrollment_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: UpdateEnrollmentTermsAccepted_update_CourseEnrollment_returning[];
}

export interface UpdateEnrollmentTermsAccepted {
  /**
   * update data of the table: "CourseEnrollment"
   */
  update_CourseEnrollment: UpdateEnrollmentTermsAccepted_update_CourseEnrollment | null;
}

export interface UpdateEnrollmentTermsAcceptedVariables {
  enrollmentId: number;
  termsAcceptedAt: any;
}
